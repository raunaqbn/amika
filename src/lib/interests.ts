// Interest categories and data for friend profiles

export interface Interest {
  id: string;
  label: string;
}

export interface InterestCategory {
  label: string;
  icon: string;
  interests: Interest[];
}

export const INTEREST_CATEGORIES: Record<string, InterestCategory> = {
  outdoor: {
    label: "Outdoor & Nature",
    icon: "🌲",
    interests: [
      { id: "hiking", label: "Hiking" },
      { id: "camping", label: "Camping" },
      { id: "beach", label: "Beach" },
      { id: "fishing", label: "Fishing" },
      { id: "kayaking", label: "Kayaking" },
      { id: "biking", label: "Biking" },
      { id: "running", label: "Running" },
      { id: "skiing", label: "Skiing / Snowboarding" },
      { id: "surfing", label: "Surfing" },
      { id: "golf", label: "Golf" },
      { id: "tennis", label: "Tennis" },
      { id: "rock-climbing", label: "Rock Climbing" },
      { id: "picnics", label: "Picnics" },
      { id: "gardening", label: "Gardening" },
    ]
  },
  food: {
    label: "Food & Drink",
    icon: "🍽️",
    interests: [
      { id: "fine-dining", label: "Fine Dining" },
      { id: "casual-dining", label: "Casual Restaurants" },
      { id: "brunch", label: "Brunch" },
      { id: "coffee", label: "Coffee" },
      { id: "wine", label: "Wine" },
      { id: "beer", label: "Craft Beer" },
      { id: "cocktails", label: "Cocktails" },
      { id: "cooking", label: "Cooking Together" },
      { id: "baking", label: "Baking" },
      { id: "food-trucks", label: "Food Trucks" },
      { id: "farmers-markets", label: "Farmers Markets" },
      { id: "food-tours", label: "Food Tours" },
      { id: "sushi", label: "Sushi / Japanese" },
      { id: "italian", label: "Italian" },
      { id: "mexican", label: "Mexican" },
      { id: "indian", label: "Indian" },
      { id: "thai", label: "Thai" },
      { id: "vegan", label: "Vegan / Plant-based" },
      { id: "bbq", label: "BBQ / Grilling" },
    ]
  },
  entertainment: {
    label: "Entertainment",
    icon: "🎬",
    interests: [
      { id: "movies", label: "Movies" },
      { id: "tv-shows", label: "TV Shows / Streaming" },
      { id: "live-music", label: "Live Music / Concerts" },
      { id: "theater", label: "Theater / Musicals" },
      { id: "comedy", label: "Comedy Shows" },
      { id: "karaoke", label: "Karaoke" },
      { id: "dancing", label: "Dancing / Clubs" },
      { id: "trivia", label: "Trivia Nights" },
      { id: "escape-rooms", label: "Escape Rooms" },
      { id: "bowling", label: "Bowling" },
      { id: "arcade", label: "Arcade / Games" },
      { id: "mini-golf", label: "Mini Golf" },
      { id: "laser-tag", label: "Laser Tag" },
      { id: "amusement-parks", label: "Amusement Parks" },
    ]
  },
  arts: {
    label: "Arts & Culture",
    icon: "🎨",
    interests: [
      { id: "museums", label: "Museums" },
      { id: "art-galleries", label: "Art Galleries" },
      { id: "painting", label: "Painting / Drawing" },
      { id: "pottery", label: "Pottery / Ceramics" },
      { id: "photography", label: "Photography" },
      { id: "crafts", label: "DIY / Crafts" },
      { id: "architecture", label: "Architecture" },
      { id: "history", label: "History" },
      { id: "book-clubs", label: "Book Clubs" },
      { id: "poetry", label: "Poetry / Open Mic" },
      { id: "film-festivals", label: "Film Festivals" },
    ]
  },
  sports: {
    label: "Sports",
    icon: "⚽",
    interests: [
      { id: "watching-football", label: "Watching Football" },
      { id: "watching-basketball", label: "Watching Basketball" },
      { id: "watching-baseball", label: "Watching Baseball" },
      { id: "watching-soccer", label: "Watching Soccer" },
      { id: "watching-hockey", label: "Watching Hockey" },
      { id: "f1", label: "F1 / Racing" },
      { id: "playing-basketball", label: "Playing Basketball" },
      { id: "playing-soccer", label: "Playing Soccer" },
      { id: "volleyball", label: "Volleyball" },
      { id: "swimming", label: "Swimming" },
      { id: "yoga", label: "Yoga" },
      { id: "pilates", label: "Pilates" },
      { id: "gym", label: "Gym / Working Out" },
      { id: "martial-arts", label: "Martial Arts" },
      { id: "boxing", label: "Boxing" },
    ]
  },
  games: {
    label: "Games & Hobbies",
    icon: "🎮",
    interests: [
      { id: "video-games", label: "Video Games" },
      { id: "board-games", label: "Board Games" },
      { id: "card-games", label: "Card Games / Poker" },
      { id: "chess", label: "Chess" },
      { id: "puzzles", label: "Puzzles" },
      { id: "dnd", label: "D&D / RPGs" },
      { id: "collecting", label: "Collecting" },
    ]
  },
  wellness: {
    label: "Wellness & Relaxation",
    icon: "🧘",
    interests: [
      { id: "spa", label: "Spa / Massage" },
      { id: "meditation", label: "Meditation" },
      { id: "sauna", label: "Sauna / Hot Springs" },
      { id: "self-care", label: "Self-care Days" },
      { id: "shopping", label: "Shopping" },
      { id: "thrifting", label: "Thrift Stores" },
    ]
  },
  social: {
    label: "Social Activities",
    icon: "👥",
    interests: [
      { id: "dinner-parties", label: "Dinner Parties" },
      { id: "game-nights", label: "Game Nights" },
      { id: "house-parties", label: "House Parties" },
      { id: "networking", label: "Networking Events" },
      { id: "volunteering", label: "Volunteering" },
      { id: "meetups", label: "Meetup Groups" },
      { id: "double-dates", label: "Double Dates" },
    ]
  },
  travel: {
    label: "Travel & Adventure",
    icon: "✈️",
    interests: [
      { id: "road-trips", label: "Road Trips" },
      { id: "weekend-getaways", label: "Weekend Getaways" },
      { id: "international-travel", label: "International Travel" },
      { id: "backpacking", label: "Backpacking" },
      { id: "luxury-travel", label: "Luxury Travel" },
      { id: "cruises", label: "Cruises" },
      { id: "staycations", label: "Staycations" },
    ]
  },
  learning: {
    label: "Learning & Growth",
    icon: "📚",
    interests: [
      { id: "workshops", label: "Workshops / Classes" },
      { id: "cooking-classes", label: "Cooking Classes" },
      { id: "wine-tasting", label: "Wine Tasting Classes" },
      { id: "language-learning", label: "Language Learning" },
      { id: "tech", label: "Tech / Coding" },
      { id: "podcasts", label: "Podcasts" },
      { id: "documentaries", label: "Documentaries" },
      { id: "lectures", label: "Lectures / Talks" },
    ]
  },
  music: {
    label: "Music",
    icon: "🎵",
    interests: [
      { id: "rock", label: "Rock" },
      { id: "pop", label: "Pop" },
      { id: "hip-hop", label: "Hip-Hop / R&B" },
      { id: "electronic", label: "Electronic / EDM" },
      { id: "jazz", label: "Jazz" },
      { id: "classical", label: "Classical" },
      { id: "country", label: "Country" },
      { id: "indie", label: "Indie / Alternative" },
      { id: "latin", label: "Latin" },
      { id: "playing-music", label: "Playing Instruments" },
    ]
  },
  pets: {
    label: "Pets & Animals",
    icon: "🐕",
    interests: [
      { id: "dogs", label: "Dog Owner / Dog Parks" },
      { id: "cats", label: "Cat Owner" },
      { id: "pet-friendly", label: "Pet-friendly Activities" },
      { id: "zoo", label: "Zoos / Aquariums" },
      { id: "wildlife", label: "Wildlife Watching" },
    ]
  }
};

// Flat list for easy lookup
export const ALL_INTERESTS = Object.values(INTEREST_CATEGORIES)
  .flatMap(cat => cat.interests);

// Get interest label by ID
export function getInterestLabel(id: string): string {
  const interest = ALL_INTERESTS.find(i => i.id === id);
  return interest?.label || id;
}

// Get interests for AI context
export function formatInterestsForAI(interestIds: string[]): string {
  return interestIds.map(getInterestLabel).join(", ");
}

// Get interest category by interest ID
export function getInterestCategory(interestId: string): string | null {
  for (const [categoryKey, category] of Object.entries(INTEREST_CATEGORIES)) {
    if (category.interests.some(i => i.id === interestId)) {
      return categoryKey;
    }
  }
  return null;
}

// Parse interests from JSON string (from database)
export function parseInterests(interestsJson: string | null | undefined): string[] {
  if (!interestsJson) return [];
  try {
    const parsed = JSON.parse(interestsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Stringify interests array to JSON (for database)
export function stringifyInterests(interests: string[]): string {
  return JSON.stringify(interests);
}
