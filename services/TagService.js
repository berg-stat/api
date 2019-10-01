import { Either, Maybe } from 'monet';

import { Tag } from '../models';


const TagService = {

  async addTag(name, category) {
    const tag = await Tag.findOne({ name }).exec();
    if (tag) {
      return Either.left('Tag with that name already exists');
    }
    const newTag = new Tag({ name, category, isActive: true });
    await newTag.save();
    return Either.right({ message: 'Tag has been added' });
  },

  async getAllTags(onlyActive = false) {
    return Maybe.fromNull(await Tag.find().select('-_id -__v').exec())
      .map(allTags => allTags.filter(tag => onlyActive ? tag.isActive : true))
      .map(tags => ({ tags }))
      .toEither('Tags not found');
  },

  async activateTag(name) {
    return Maybe.fromNull(await Tag.findOneAndUpdate({ name }, { isActive: true }, { new: true }).exec())
      .map(tag => ({
        message: 'Tag activated',
        tag
      }))
      .toEither('Tag not found');
  },

  async deactivateTag(name) {
    return Maybe.fromNull(await Tag.findOneAndUpdate({ name }, { isActive: false }, { new: true }).exec())
      .map(tag => ({
        message: 'Tag deactivated',
        tag
      }))
      .toEither('Tag not found');
  },

  async deleteTag(name) {
    return Maybe.fromNull(await Tag.findOneAndDelete({ name }).exec())
      .map(() => ({ message: 'Tag deleted' }))
      .toEither('Tag not found');
  },
};

export default TagService;
