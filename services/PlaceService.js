import { Either, Maybe } from 'monet';
import { Place } from '../models';


const PlaceService = {

  async addPlace(placeName, placeCoordinates) {
    const place = await Place.findOne({ name: placeName }).exec();
    if (place) {
      return Either.left('Place with that name already exists');
    }
    const newPlace = new Place({ name: placeName, coordinates: placeCoordinates });
    await newPlace.save();
    return Either.right({ message: 'Place has been added' });
  },


  async getAllPlaces() {
    return Maybe.fromNull(await Place.find().exec())
      .map(places => ({ places }))
      .toEither('Places not found');
  },


  async getPlaceByName(placeName) {
    return Maybe.fromNull(await Place.findOne({ name: placeName }).exec())
      .map(place => ({ place }))
      .toEither('Place not found');
  },


  async updatePlace(placeId, newPlaceName, newPlaceCoordinates) {
    return Maybe.fromNull(await Place.findByIdAndUpdate(placeId, {
        name: newPlaceName,
        coordinates: newPlaceCoordinates
      }, { new: true }).exec())
      .map(place => ({
        message: 'Place updated',
        place
      }))
      .toEither('Place not found');
  },


  async deletePlace(placeName) {
    return Maybe.fromNull(await Place.findOneAndDelete({ name: placeName }).exec())
      .map(() => ({ message: 'Place deleted' }))
      .toEither('Place not found');
  }
};

export default PlaceService;
