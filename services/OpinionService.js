import { Either, Maybe } from 'monet';

import {
  Opinion,
  Place,
  User,
  Report,
} from '../models';
import { ReportReasons } from '../models/Report';


const OpinionService = {

  async __getPlaceId(placeName) {
    return Maybe.fromNull(await Place.findOne({ name: placeName }).select('_id').exec())
      .toEither('Place with given name does not exist');
  },

  async addOpinion(placeName, authorId, text, date, tags) {
    return (await OpinionService.__getPlaceId(placeName))
      .flatMap(async placeId => {
        const newOpinion = new Opinion({
          author: authorId,
          place: placeId,
          text,
          date,
          tags
        });
        const addedOpinion = await newOpinion.save();
        return Maybe.pure({
          message: 'Opinion added',
          opinion: addedOpinion
        }).toEither();
      });
  },

  async findAllOpinions(placeName) {
    const addUserToOpinion = async (opinion) => {
      const user = await User.findById(opinion.author).select('username').exec();
      return ({ ...opinion._doc, user });
    };

    const futureOpinionsWithUsers = Maybe.fromNull(await Place.findOne({ name: placeName }).select('_id').exec())
      .flatMap(async place =>
        Maybe.fromNull(await Opinion.find({ place: place }).exec())
          .map(opinions => opinions.filter(op => !op.isDeleted && !op.isBlocked))
          .flatMap(listOfOpinions => listOfOpinions.map(addUserToOpinion))
      );

    const opinionsWithUsers = await Promise.all(await futureOpinionsWithUsers);
    return { opinions: opinionsWithUsers };
  },

  async findAllOpinionsAllPlaces() {
    const allPlaces = await Place.find().select('_id name').exec();

    const findOpinionsForPlace = async place => {
      const opinions = (await Opinion.find({ place }).select('-reports').exec()).filter(opinion => !opinion.isDeleted);
      return opinions.map(opinion => ({ opinion, place }));
    };

    const addUser = async (opinionWithPlace) => {
      const author = await User.findOne({ _id: opinionWithPlace.opinion.author }).select('username _id').exec();
      return ({
        ...opinionWithPlace,
        author
      });
    };

    const futureOpinionsWithUsersAndPlaces = allPlaces.flatMap(async place => {
      const opinionsWithPlace = await findOpinionsForPlace(place);
      // TODO: Clojure
      return (await (opinionsWithPlace.map(async opinionWithPlace => (await addUser(opinionWithPlace)))));
    });

    const opinions = await Promise.all((await Promise.all(futureOpinionsWithUsersAndPlaces)).flat(1));
    return { opinions };
  },

  async findAllBlockedOpinions() {
    return Maybe.fromNull(await Opinion.find({ isBlocked: true }).exec())
      .map(blockedOpinions => ({ blockedOpinions }))
      .toEither({ opinions: [] });
  },

  async getSingleOpinion(opinionId) {
    return Maybe.fromNull(await Opinion.findById(opinionId).exec())
      .map(opinion => ({ opinion }))
      .toEither('Opinion not found');
  },


  async __verifyOwner(opinionId, userId) {
    return Maybe.fromNull(await Opinion.findById(opinionId).exec())
      .toEither('Opinion not found')
      .flatMap(opinion =>
        Maybe.pure(opinion)
          .filter(opinion => opinion.author.toString() === userId.toString())
          .toEither('You have no permission to delete this resource')
      );
  },

  async deleteOpinion(opinionId, userId) {
    return (await OpinionService.__verifyOwner(opinionId, userId))
      .flatMap(async opinion =>
        (Maybe.fromNull(await Opinion.findByIdAndUpdate(opinion._id, { isDeleted: true }).exec())
          .toEither('Opinion not found'))
          .map(() => ({ message: 'Opinion deleted' }))
      );
  },

  async deleteOpinionByAdmin(opinionId) {
    return Maybe.fromNull(await Opinion.findByIdAndUpdate(opinionId, { isDeleted: true }).exec())
      .map(() => ({ message: 'Opinion deleted' }))
      .toEither('Opinion not found');
  },

  async updateOpinion(opinionId, userId, { text, date, tags }) {
    return (await OpinionService.__verifyOwner(opinionId, userId))
      .flatMap(async opinion =>
        (Maybe.fromNull(await Opinion.findByIdAndUpdate(opinion._id, {
            text,
            date,
            tags
          }, { new: true }).exec())
          .toEither('Opinion not found'))
          .map(opinion => ({
            message: 'Opinion updated',
            opinion
          }))
      );
  },

  async blockOpinion(opinionId) {
    return Maybe.fromNull(await Opinion.findByIdAndUpdate(opinionId, { isBlocked: true }, { new: true }).exec())
      .map(opinion => ({
        message: 'Opinion blocked',
        opinion
      }))
      .toEither('Opinion not found');
  },

  async unblockOpinion(opinionId) {
    return Maybe.fromNull(await Opinion.findByIdAndUpdate(opinionId, { isBlocked: false }, { new: true }).exec())
      .map(opinion => ({
        message: 'Opinion unblocked',
        opinion
      }))
      .toEither('Opinion not found');
  },

  async addLikeToOpinion(opinionId, userId) {
    return Maybe.fromNull(await Opinion.findById(opinionId).exec())
      .toEither('Opinion not found')
      .flatMap(async opinion =>
        Maybe.fromNull(await User.findById(userId).exec())
          .filterNot(user => opinion.likes.includes(user.username))
          .map(async user => await Opinion.findByIdAndUpdate(opinion._id, { $push: { likes: user.username } }).exec())
          .toEither('You have already liked this opinion')
      );
  },

  async addUnlikeToOpinion(opinionId, userId) {
    return Maybe.fromNull(await Opinion.findById(opinionId).exec())
      .toEither('Opinion not found')
      .flatMap(async opinion =>
        Maybe.fromNull(await User.findById(userId).exec())
          .filter(user => opinion.likes.includes(user.username))
          .map(async user => await Opinion.findByIdAndUpdate(opinion._id, { $pull: { likes: user.username } }).exec())
          .toEither('You did not like this opinion')
      );
  },

  getReportReasons() {
    return ({
      reasons: ReportReasons
    });
  },

  async reportOpinion(opinionId, userId, reportText, reportReason) {
    const limitOfReports = 3;

    const filteredReason = Maybe.pure(reportReason)
      .filter(reason => ReportReasons.includes(reason))
      .toEither('You provide invalid report reason');

    const findOpinion = async opinionId => {
      return Maybe.fromNull(await Opinion.findById(opinionId).exec())
        .toEither('Opinion not found');
    };

    const findUser = async userId => {
      return Maybe.fromNull(await User.findById(userId).exec())
        .toEither('User not found');
    };

    const checkIfUserAlreadyReportOpinion = (user, opinion) => {
      return opinion.reports.map(report => report.author.toString().trim()).includes(user._id.toString().trim());
    };

    const createAndSaveReport = async (user, opinion, reason, reportText) => {
      if (checkIfUserAlreadyReportOpinion(user, opinion)) {
        return Either.left('You have already reported this opinion.');
      } else {
        const newReport = new Report({
          author: user._id,
          opinion: opinion._id,
          reason: reason,
          text: reportText
        });
        let updatedOpinion = await Opinion.findByIdAndUpdate(opinion._id, { $push: { reports: newReport } }, { new: true }).exec();
        if (updatedOpinion.reports.length >= limitOfReports) {
          updatedOpinion = await Opinion.findByIdAndUpdate(opinion._id, { isBlocked: true }, { new: true }).exec();
        }
        return Maybe.pure({
          message: 'Opinion reported',
          opinion: updatedOpinion
        }).toEither('Report creation failed');
      }
    };

    return filteredReason.flatMap(async reason =>
      (await findOpinion(opinionId)).flatMap(async opinion =>
        (await findUser(userId)).flatMap(async user =>
          await createAndSaveReport(user, opinion, reason, reportText))));
  },
};


export default OpinionService;
