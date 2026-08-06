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

// Custom interest prefix - used to identify user-created interests
export const CUSTOM_INTEREST_PREFIX = "custom:";

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
      { id: "canoeing", label: "Canoeing" },
      { id: "paddleboarding", label: "Paddleboarding" },
      { id: "biking", label: "Biking" },
      { id: "mountain-biking", label: "Mountain Biking" },
      { id: "running", label: "Running" },
      { id: "trail-running", label: "Trail Running" },
      { id: "skiing", label: "Skiing / Snowboarding" },
      { id: "cross-country-skiing", label: "Cross-Country Skiing" },
      { id: "ice-skating", label: "Ice Skating" },
      { id: "surfing", label: "Surfing" },
      { id: "golf", label: "Golf" },
      { id: "tennis", label: "Tennis" },
      { id: "pickleball", label: "Pickleball" },
      { id: "badminton", label: "Badminton" },
      { id: "rock-climbing", label: "Rock Climbing" },
      { id: "bouldering", label: "Bouldering" },
      { id: "picnics", label: "Picnics" },
      { id: "gardening", label: "Gardening" },
      { id: "bird-watching", label: "Bird Watching" },
      { id: "stargazing", label: "Stargazing" },
      { id: "scuba-diving", label: "Scuba Diving" },
      { id: "snorkeling", label: "Snorkeling" },
      { id: "sailing", label: "Sailing" },
      { id: "horseback-riding", label: "Horseback Riding" },
      { id: "paragliding", label: "Paragliding" },
      { id: "skydiving", label: "Skydiving" },
      { id: "sledding", label: "Sledding / Tubing" },
      { id: "frisbee", label: "Frisbee / Disc Golf" },
    ]
  },
  food: {
    label: "Food & Drink",
    icon: "🍽️",
    interests: [
      { id: "fine-dining", label: "Fine Dining" },
      { id: "casual-dining", label: "Casual Restaurants" },
      { id: "brunch", label: "Brunch" },
      { id: "breakfast", label: "Breakfast Spots" },
      { id: "coffee", label: "Coffee" },
      { id: "tea", label: "Tea" },
      { id: "bubble-tea", label: "Bubble Tea / Boba" },
      { id: "wine", label: "Wine" },
      { id: "beer", label: "Craft Beer" },
      { id: "cocktails", label: "Cocktails" },
      { id: "whiskey", label: "Whiskey / Bourbon" },
      { id: "sake", label: "Sake" },
      { id: "non-alcoholic", label: "Non-Alcoholic Drinks" },
      { id: "cooking", label: "Cooking Together" },
      { id: "baking", label: "Baking" },
      { id: "food-trucks", label: "Food Trucks" },
      { id: "farmers-markets", label: "Farmers Markets" },
      { id: "food-tours", label: "Food Tours" },
      { id: "sushi", label: "Sushi / Japanese" },
      { id: "ramen", label: "Ramen" },
      { id: "korean", label: "Korean" },
      { id: "chinese", label: "Chinese" },
      { id: "dim-sum", label: "Dim Sum" },
      { id: "vietnamese", label: "Vietnamese" },
      { id: "italian", label: "Italian" },
      { id: "pizza", label: "Pizza" },
      { id: "mexican", label: "Mexican" },
      { id: "tacos", label: "Tacos" },
      { id: "indian", label: "Indian" },
      { id: "thai", label: "Thai" },
      { id: "mediterranean", label: "Mediterranean" },
      { id: "greek", label: "Greek" },
      { id: "middle-eastern", label: "Middle Eastern" },
      { id: "ethiopian", label: "Ethiopian" },
      { id: "caribbean", label: "Caribbean" },
      { id: "soul-food", label: "Soul Food" },
      { id: "french", label: "French" },
      { id: "spanish", label: "Spanish / Tapas" },
      { id: "german", label: "German" },
      { id: "brazilian", label: "Brazilian" },
      { id: "peruvian", label: "Peruvian" },
      { id: "vegan", label: "Vegan / Plant-based" },
      { id: "vegetarian", label: "Vegetarian" },
      { id: "gluten-free", label: "Gluten-free" },
      { id: "bbq", label: "BBQ / Grilling" },
      { id: "seafood", label: "Seafood" },
      { id: "steakhouse", label: "Steakhouse" },
      { id: "burgers", label: "Burgers" },
      { id: "desserts", label: "Desserts / Sweets" },
      { id: "ice-cream", label: "Ice Cream" },
      { id: "bakeries", label: "Bakeries" },
      { id: "street-food", label: "Street Food" },
      { id: "food-halls", label: "Food Halls" },
      { id: "happy-hour", label: "Happy Hour" },
    ]
  },
  entertainment: {
    label: "Entertainment",
    icon: "🎬",
    interests: [
      { id: "movies", label: "Movies" },
      { id: "horror-movies", label: "Horror Movies" },
      { id: "action-movies", label: "Action Movies" },
      { id: "rom-coms", label: "Romantic Comedies" },
      { id: "documentaries-film", label: "Documentary Films" },
      { id: "anime", label: "Anime" },
      { id: "tv-shows", label: "TV Shows / Streaming" },
      { id: "reality-tv", label: "Reality TV" },
      { id: "live-music", label: "Live Music / Concerts" },
      { id: "music-festivals", label: "Music Festivals" },
      { id: "theater", label: "Theater / Musicals" },
      { id: "opera", label: "Opera" },
      { id: "ballet", label: "Ballet / Dance Shows" },
      { id: "comedy", label: "Comedy Shows" },
      { id: "improv", label: "Improv Shows" },
      { id: "magic-shows", label: "Magic Shows" },
      { id: "karaoke", label: "Karaoke" },
      { id: "dancing", label: "Dancing / Clubs" },
      { id: "salsa-dancing", label: "Salsa Dancing" },
      { id: "line-dancing", label: "Line Dancing" },
      { id: "swing-dancing", label: "Swing Dancing" },
      { id: "trivia", label: "Trivia Nights" },
      { id: "pub-quiz", label: "Pub Quiz" },
      { id: "escape-rooms", label: "Escape Rooms" },
      { id: "murder-mystery", label: "Murder Mystery" },
      { id: "bowling", label: "Bowling" },
      { id: "arcade", label: "Arcade / Games" },
      { id: "mini-golf", label: "Mini Golf" },
      { id: "laser-tag", label: "Laser Tag" },
      { id: "paintball", label: "Paintball" },
      { id: "go-karts", label: "Go-Karts" },
      { id: "trampoline-parks", label: "Trampoline Parks" },
      { id: "amusement-parks", label: "Amusement Parks" },
      { id: "water-parks", label: "Water Parks" },
      { id: "haunted-houses", label: "Haunted Houses" },
      { id: "drive-in-movies", label: "Drive-In Movies" },
      { id: "drag-shows", label: "Drag Shows" },
      { id: "circus", label: "Circus / Acrobatics" },
      { id: "casino", label: "Casino" },
    ]
  },
  arts: {
    label: "Arts & Culture",
    icon: "🎨",
    interests: [
      { id: "museums", label: "Museums" },
      { id: "science-museums", label: "Science Museums" },
      { id: "history-museums", label: "History Museums" },
      { id: "art-galleries", label: "Art Galleries" },
      { id: "street-art", label: "Street Art / Murals" },
      { id: "painting", label: "Painting / Drawing" },
      { id: "watercolor", label: "Watercolor" },
      { id: "digital-art", label: "Digital Art" },
      { id: "pottery", label: "Pottery / Ceramics" },
      { id: "sculpture", label: "Sculpture" },
      { id: "photography", label: "Photography" },
      { id: "film-photography", label: "Film Photography" },
      { id: "crafts", label: "DIY / Crafts" },
      { id: "knitting", label: "Knitting / Crocheting" },
      { id: "sewing", label: "Sewing" },
      { id: "woodworking", label: "Woodworking" },
      { id: "jewelry-making", label: "Jewelry Making" },
      { id: "calligraphy", label: "Calligraphy" },
      { id: "architecture", label: "Architecture" },
      { id: "history", label: "History" },
      { id: "book-clubs", label: "Book Clubs" },
      { id: "reading", label: "Reading" },
      { id: "writing", label: "Writing" },
      { id: "poetry", label: "Poetry / Open Mic" },
      { id: "storytelling", label: "Storytelling" },
      { id: "film-festivals", label: "Film Festivals" },
      { id: "art-walks", label: "Art Walks" },
      { id: "cultural-festivals", label: "Cultural Festivals" },
      { id: "antiques", label: "Antiques" },
      { id: "flea-markets", label: "Flea Markets" },
    ]
  },
  sports: {
    label: "Sports",
    icon: "⚽",
    interests: [
      { id: "watching-football", label: "Watching Football (NFL)" },
      { id: "watching-basketball", label: "Watching Basketball (NBA)" },
      { id: "watching-baseball", label: "Watching Baseball (MLB)" },
      { id: "watching-soccer", label: "Watching Soccer" },
      { id: "watching-hockey", label: "Watching Hockey (NHL)" },
      { id: "watching-tennis", label: "Watching Tennis" },
      { id: "watching-golf", label: "Watching Golf" },
      { id: "watching-mma", label: "Watching MMA / UFC" },
      { id: "watching-wrestling", label: "Watching Wrestling" },
      { id: "watching-olympics", label: "Olympics" },
      { id: "college-sports", label: "College Sports" },
      { id: "f1", label: "F1 / Racing" },
      { id: "nascar", label: "NASCAR" },
      { id: "playing-basketball", label: "Playing Basketball" },
      { id: "playing-soccer", label: "Playing Soccer" },
      { id: "playing-football", label: "Playing Football" },
      { id: "softball", label: "Softball / Baseball" },
      { id: "volleyball", label: "Volleyball" },
      { id: "beach-volleyball", label: "Beach Volleyball" },
      { id: "swimming", label: "Swimming" },
      { id: "water-polo", label: "Water Polo" },
      { id: "yoga", label: "Yoga" },
      { id: "hot-yoga", label: "Hot Yoga" },
      { id: "pilates", label: "Pilates" },
      { id: "barre", label: "Barre" },
      { id: "crossfit", label: "CrossFit" },
      { id: "gym", label: "Gym / Working Out" },
      { id: "weightlifting", label: "Weightlifting" },
      { id: "spin-class", label: "Spin / Cycling Class" },
      { id: "aerobics", label: "Aerobics / Zumba" },
      { id: "martial-arts", label: "Martial Arts" },
      { id: "boxing", label: "Boxing" },
      { id: "kickboxing", label: "Kickboxing" },
      { id: "jiu-jitsu", label: "Brazilian Jiu-Jitsu" },
      { id: "fencing", label: "Fencing" },
      { id: "archery", label: "Archery" },
      { id: "table-tennis", label: "Table Tennis" },
      { id: "racquetball", label: "Racquetball / Squash" },
      { id: "hockey-playing", label: "Playing Hockey" },
      { id: "lacrosse", label: "Lacrosse" },
      { id: "rugby", label: "Rugby" },
      { id: "cricket", label: "Cricket" },
      { id: "skateboarding", label: "Skateboarding" },
      { id: "rollerblading", label: "Rollerblading" },
    ]
  },
  games: {
    label: "Games & Hobbies",
    icon: "🎮",
    interests: [
      { id: "video-games", label: "Video Games" },
      { id: "pc-gaming", label: "PC Gaming" },
      { id: "console-gaming", label: "Console Gaming" },
      { id: "retro-gaming", label: "Retro Gaming" },
      { id: "mobile-games", label: "Mobile Games" },
      { id: "vr-gaming", label: "VR Gaming" },
      { id: "esports", label: "Esports" },
      { id: "board-games", label: "Board Games" },
      { id: "strategy-games", label: "Strategy Games" },
      { id: "card-games", label: "Card Games / Poker" },
      { id: "bridge", label: "Bridge" },
      { id: "mahjong", label: "Mahjong" },
      { id: "chess", label: "Chess" },
      { id: "puzzles", label: "Puzzles" },
      { id: "crosswords", label: "Crosswords" },
      { id: "sudoku", label: "Sudoku" },
      { id: "dnd", label: "D&D / RPGs" },
      { id: "larp", label: "LARP" },
      { id: "magic-gathering", label: "Magic: The Gathering" },
      { id: "pokemon", label: "Pokemon" },
      { id: "collecting", label: "Collecting" },
      { id: "lego", label: "LEGO" },
      { id: "model-building", label: "Model Building" },
      { id: "rc-cars", label: "RC Cars / Drones" },
      { id: "cosplay", label: "Cosplay" },
      { id: "comic-books", label: "Comic Books" },
      { id: "manga", label: "Manga" },
    ]
  },
  wellness: {
    label: "Wellness & Relaxation",
    icon: "🧘",
    interests: [
      { id: "spa", label: "Spa / Massage" },
      { id: "facials", label: "Facials" },
      { id: "manicure-pedicure", label: "Manicure / Pedicure" },
      { id: "meditation", label: "Meditation" },
      { id: "mindfulness", label: "Mindfulness" },
      { id: "breathwork", label: "Breathwork" },
      { id: "sound-bath", label: "Sound Bath" },
      { id: "sauna", label: "Sauna / Hot Springs" },
      { id: "float-tanks", label: "Float Tanks" },
      { id: "acupuncture", label: "Acupuncture" },
      { id: "self-care", label: "Self-care Days" },
      { id: "journaling", label: "Journaling" },
      { id: "therapy", label: "Therapy / Counseling" },
      { id: "aromatherapy", label: "Aromatherapy" },
      { id: "reiki", label: "Reiki / Energy Healing" },
      { id: "shopping", label: "Shopping" },
      { id: "thrifting", label: "Thrift Stores" },
      { id: "vintage-shopping", label: "Vintage Shopping" },
      { id: "mall-shopping", label: "Mall Shopping" },
      { id: "boutique-shopping", label: "Boutique Shopping" },
    ]
  },
  social: {
    label: "Social Activities",
    icon: "👥",
    interests: [
      { id: "dinner-parties", label: "Dinner Parties" },
      { id: "potlucks", label: "Potlucks" },
      { id: "game-nights", label: "Game Nights" },
      { id: "movie-nights", label: "Movie Nights" },
      { id: "house-parties", label: "House Parties" },
      { id: "bbq-parties", label: "BBQ Parties" },
      { id: "themed-parties", label: "Themed Parties" },
      { id: "networking", label: "Networking Events" },
      { id: "professional-events", label: "Professional Events" },
      { id: "volunteering", label: "Volunteering" },
      { id: "charity-events", label: "Charity Events" },
      { id: "community-service", label: "Community Service" },
      { id: "meetups", label: "Meetup Groups" },
      { id: "book-club-meetups", label: "Book Club Meetups" },
      { id: "double-dates", label: "Double Dates" },
      { id: "group-dates", label: "Group Hangouts" },
      { id: "bridal-showers", label: "Bridal / Baby Showers" },
      { id: "birthday-parties", label: "Birthday Parties" },
      { id: "holiday-gatherings", label: "Holiday Gatherings" },
      { id: "religious-services", label: "Religious Services" },
      { id: "spiritual-groups", label: "Spiritual Groups" },
      { id: "support-groups", label: "Support Groups" },
      { id: "activism", label: "Activism / Causes" },
      { id: "political-events", label: "Political Events" },
    ]
  },
  travel: {
    label: "Travel & Adventure",
    icon: "✈️",
    interests: [
      { id: "scenic-drives", label: "Scenic Drives" },
      { id: "weekend-getaways", label: "Weekend Getaways" },
      { id: "local-adventures", label: "Local Adventures" },
      { id: "international-travel", label: "International Travel" },
      { id: "domestic-travel", label: "Domestic Travel" },
      { id: "backpacking", label: "Backpacking" },
      { id: "luxury-travel", label: "Luxury Travel" },
      { id: "budget-travel", label: "Budget Travel" },
      { id: "solo-travel", label: "Solo Travel" },
      { id: "group-travel", label: "Group Travel" },
      { id: "cruises", label: "Cruises" },
      { id: "river-cruises", label: "River Cruises" },
      { id: "staycations", label: "Staycations" },
      { id: "glamping", label: "Glamping" },
      { id: "rv-travel", label: "RV Travel" },
      { id: "train-travel", label: "Train Travel" },
      { id: "adventure-travel", label: "Adventure Travel" },
      { id: "eco-travel", label: "Eco-Tourism" },
      { id: "cultural-travel", label: "Cultural Travel" },
      { id: "food-travel", label: "Food Travel" },
      { id: "beach-vacations", label: "Beach Vacations" },
      { id: "mountain-vacations", label: "Mountain Vacations" },
      { id: "city-breaks", label: "City Breaks" },
      { id: "theme-parks", label: "Theme Parks" },
      { id: "wine-country", label: "Wine Country" },
      { id: "national-parks", label: "National Parks" },
      { id: "historical-sites", label: "Historical Sites" },
    ]
  },
  learning: {
    label: "Learning & Growth",
    icon: "📚",
    interests: [
      { id: "workshops", label: "Workshops / Classes" },
      { id: "cooking-classes", label: "Cooking Classes" },
      { id: "wine-tasting", label: "Wine Tasting Classes" },
      { id: "cocktail-classes", label: "Cocktail Classes" },
      { id: "art-classes", label: "Art Classes" },
      { id: "dance-classes", label: "Dance Classes" },
      { id: "music-lessons", label: "Music Lessons" },
      { id: "language-learning", label: "Language Learning" },
      { id: "sign-language", label: "Sign Language" },
      { id: "tech", label: "Tech / Coding" },
      { id: "data-science", label: "Data Science / AI" },
      { id: "investing", label: "Investing / Finance" },
      { id: "entrepreneurship", label: "Entrepreneurship" },
      { id: "public-speaking", label: "Public Speaking" },
      { id: "creative-writing", label: "Creative Writing" },
      { id: "photography-classes", label: "Photography Classes" },
      { id: "fitness-certifications", label: "Fitness Certifications" },
      { id: "podcasts", label: "Podcasts" },
      { id: "audiobooks", label: "Audiobooks" },
      { id: "documentaries", label: "Documentaries" },
      { id: "ted-talks", label: "TED Talks" },
      { id: "lectures", label: "Lectures / Talks" },
      { id: "online-courses", label: "Online Courses" },
      { id: "book-discussions", label: "Book Discussions" },
      { id: "philosophy", label: "Philosophy" },
      { id: "psychology", label: "Psychology" },
      { id: "science", label: "Science" },
      { id: "astronomy", label: "Astronomy" },
    ]
  },
  music: {
    label: "Music",
    icon: "🎵",
    interests: [
      { id: "rock", label: "Rock" },
      { id: "metal", label: "Metal" },
      { id: "punk", label: "Punk" },
      { id: "pop", label: "Pop" },
      { id: "kpop", label: "K-Pop" },
      { id: "jpop", label: "J-Pop" },
      { id: "hip-hop", label: "Hip-Hop / R&B" },
      { id: "rap", label: "Rap" },
      { id: "soul", label: "Soul / Motown" },
      { id: "electronic", label: "Electronic / EDM" },
      { id: "techno", label: "Techno / House" },
      { id: "dubstep", label: "Dubstep" },
      { id: "jazz", label: "Jazz" },
      { id: "blues", label: "Blues" },
      { id: "classical", label: "Classical" },
      { id: "opera-music", label: "Opera" },
      { id: "country", label: "Country" },
      { id: "folk", label: "Folk" },
      { id: "bluegrass", label: "Bluegrass" },
      { id: "indie", label: "Indie / Alternative" },
      { id: "latin", label: "Latin" },
      { id: "reggaeton", label: "Reggaeton" },
      { id: "reggae", label: "Reggae" },
      { id: "afrobeat", label: "Afrobeat" },
      { id: "world-music", label: "World Music" },
      { id: "gospel", label: "Gospel" },
      { id: "broadway", label: "Broadway / Showtunes" },
      { id: "film-scores", label: "Film Scores" },
      { id: "lo-fi", label: "Lo-fi / Chill" },
      { id: "playing-music", label: "Playing Instruments" },
      { id: "singing", label: "Singing" },
      { id: "dj", label: "DJing" },
      { id: "music-production", label: "Music Production" },
      { id: "vinyl-records", label: "Vinyl / Records" },
    ]
  },
  pets: {
    label: "Pets & Animals",
    icon: "🐕",
    interests: [
      { id: "dogs", label: "Dog Owner / Dog Parks" },
      { id: "dog-training", label: "Dog Training" },
      { id: "dog-shows", label: "Dog Shows" },
      { id: "cats", label: "Cat Owner" },
      { id: "cat-cafes", label: "Cat Cafes" },
      { id: "birds", label: "Birds" },
      { id: "fish", label: "Fish / Aquariums" },
      { id: "reptiles", label: "Reptiles" },
      { id: "small-pets", label: "Small Pets (Hamsters, etc.)" },
      { id: "horses", label: "Horses" },
      { id: "pet-friendly", label: "Pet-friendly Activities" },
      { id: "pet-adoption", label: "Pet Adoption / Rescue" },
      { id: "zoo", label: "Zoos / Aquariums" },
      { id: "wildlife", label: "Wildlife Watching" },
      { id: "safari", label: "Safari" },
      { id: "whale-watching", label: "Whale Watching" },
      { id: "animal-sanctuaries", label: "Animal Sanctuaries" },
      { id: "farm-visits", label: "Farm Visits" },
    ]
  },
  technology: {
    label: "Technology & Digital",
    icon: "💻",
    interests: [
      { id: "tech-gadgets", label: "Tech Gadgets" },
      { id: "smartphones", label: "Smartphones" },
      { id: "smart-home", label: "Smart Home" },
      { id: "computers", label: "Computers / PC Building" },
      { id: "programming", label: "Programming" },
      { id: "web-development", label: "Web Development" },
      { id: "app-development", label: "App Development" },
      { id: "artificial-intelligence", label: "AI / Machine Learning" },
      { id: "cryptocurrency", label: "Cryptocurrency" },
      { id: "blockchain", label: "Blockchain" },
      { id: "cybersecurity", label: "Cybersecurity" },
      { id: "3d-printing", label: "3D Printing" },
      { id: "robotics", label: "Robotics" },
      { id: "electronics", label: "Electronics / DIY" },
      { id: "social-media", label: "Social Media" },
      { id: "content-creation", label: "Content Creation" },
      { id: "streaming", label: "Streaming (Twitch, etc.)" },
      { id: "youtube", label: "YouTube" },
      { id: "podcasting", label: "Podcasting" },
      { id: "blogging", label: "Blogging" },
    ]
  },
  family: {
    label: "Family & Kids",
    icon: "👨‍👩‍👧‍👦",
    interests: [
      { id: "family-activities", label: "Family Activities" },
      { id: "kid-friendly", label: "Kid-Friendly Outings" },
      { id: "playgrounds", label: "Playgrounds" },
      { id: "childrens-museums", label: "Children's Museums" },
      { id: "family-movies", label: "Family Movies" },
      { id: "family-games", label: "Family Game Nights" },
      { id: "school-events", label: "School Events" },
      { id: "sports-leagues", label: "Kids' Sports Leagues" },
      { id: "birthday-traditions", label: "Birthday Traditions" },
      { id: "parenting-groups", label: "Parenting Groups" },
      { id: "parent-date-nights", label: "Parent Date Nights" },
      { id: "baby-activities", label: "Baby Activities" },
      { id: "storytime", label: "Storytime" },
      { id: "crafts-kids", label: "Crafts with Kids" },
      { id: "educational-activities", label: "Educational Activities" },
    ]
  },
  nightlife: {
    label: "Nightlife",
    icon: "🌙",
    interests: [
      { id: "bars", label: "Bars" },
      { id: "dive-bars", label: "Dive Bars" },
      { id: "rooftop-bars", label: "Rooftop Bars" },
      { id: "speakeasies", label: "Speakeasies" },
      { id: "wine-bars", label: "Wine Bars" },
      { id: "sports-bars", label: "Sports Bars" },
      { id: "nightclubs", label: "Nightclubs" },
      { id: "lounges", label: "Lounges" },
      { id: "pool-halls", label: "Pool Halls" },
      { id: "darts", label: "Darts" },
      { id: "late-night-eats", label: "Late Night Eats" },
      { id: "after-parties", label: "After Parties" },
      { id: "pub-crawls", label: "Pub Crawls" },
      { id: "wine-nights", label: "Wine Nights" },
      { id: "girls-night", label: "Girls Night Out" },
      { id: "guys-night", label: "Guys Night Out" },
    ]
  },
  fashion: {
    label: "Fashion & Style",
    icon: "👗",
    interests: [
      { id: "fashion", label: "Fashion" },
      { id: "streetwear", label: "Streetwear" },
      { id: "vintage-fashion", label: "Vintage Fashion" },
      { id: "designer-fashion", label: "Designer Fashion" },
      { id: "sustainable-fashion", label: "Sustainable Fashion" },
      { id: "sneakers", label: "Sneakers" },
      { id: "accessories", label: "Accessories" },
      { id: "jewelry", label: "Jewelry" },
      { id: "watches", label: "Watches" },
      { id: "handbags", label: "Handbags" },
      { id: "makeup", label: "Makeup / Beauty" },
      { id: "skincare", label: "Skincare" },
      { id: "haircare", label: "Haircare" },
      { id: "nail-art", label: "Nail Art" },
      { id: "fragrance", label: "Fragrance / Perfume" },
      { id: "fashion-shows", label: "Fashion Shows" },
      { id: "personal-styling", label: "Personal Styling" },
    ]
  },
  automotive: {
    label: "Automotive",
    icon: "🚗",
    interests: [
      { id: "cars", label: "Cars" },
      { id: "classic-cars", label: "Classic Cars" },
      { id: "sports-cars", label: "Sports Cars" },
      { id: "electric-vehicles", label: "Electric Vehicles" },
      { id: "motorcycles", label: "Motorcycles" },
      { id: "car-shows", label: "Car Shows" },
      { id: "auto-racing", label: "Auto Racing" },
      { id: "car-detailing", label: "Car Detailing" },
      { id: "off-roading", label: "Off-Roading" },
      { id: "car-camping", label: "Car Camping" },
      { id: "road-rallies", label: "Road Rallies" },
    ]
  }
};

// Flat list for easy lookup
export const ALL_INTERESTS = Object.values(INTEREST_CATEGORIES)
  .flatMap(cat => cat.interests);

// Check if an interest is custom
export function isCustomInterest(id: string): boolean {
  return id.startsWith(CUSTOM_INTEREST_PREFIX);
}

// Create a custom interest ID from a label
export function createCustomInterestId(label: string): string {
  return `${CUSTOM_INTEREST_PREFIX}${label}`;
}

// Get the label from a custom interest ID
export function getCustomInterestLabel(id: string): string {
  return id.slice(CUSTOM_INTEREST_PREFIX.length);
}

// Get interest label by ID (handles both predefined and custom interests)
export function getInterestLabel(id: string): string {
  // Handle custom interests
  if (isCustomInterest(id)) {
    return getCustomInterestLabel(id);
  }
  // Handle predefined interests
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
