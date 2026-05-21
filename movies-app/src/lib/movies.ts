export type CanonMovie = {
  title: string;
  director: string;
  year: number;
  note: string;
  searchQuery?: string;
};

// Peter Chletsos's Peter's Movies Movies. In no particular order — and the list is fluid.
// "It's not what you look at that matters; it's what you see." — Henry David Thoreau
export const movies: CanonMovie[] = [
  {
    title: "The Wizard of Oz",
    director: "Victor Fleming",
    year: 1939,
    note: "Three strips of Technicolor, a yellow brick road, and the moment American cinema understood what a dream looks like in color."
  },
  {
    title: "Citizen Kane",
    director: "Orson Welles",
    year: 1941,
    note: "Welles was 25. Toland's deep-focus, the broken sled, the fortune that didn't fix him. Still the textbook."
  },
  {
    title: "It's a Wonderful Life",
    director: "Frank Capra",
    year: 1946,
    note: "Bedford Falls, Clarence the angel, and the hard math of one ordinary life. Earned its place by accident and kept it on purpose."
  },
  {
    title: "The Treasure of the Sierra Madre",
    director: "John Huston",
    year: 1948,
    note: "Gold corrupts. Bogart spirals. Walter Huston wins an Oscar dancing in the dirt. 'We don't need no stinking badges.'"
  },
  {
    title: "The Loneliness of the Long Distance Runner",
    director: "Tony Richardson",
    year: 1962,
    note: "British New Wave kitchen-sink at its sharpest. Tom Courtenay running on borstal grounds, refusing the finish line on principle."
  },
  {
    title: "It's a Mad, Mad, Mad, Mad World",
    director: "Stanley Kramer",
    year: 1963,
    note: "Every comedian in Hollywood, one buried fortune, three hours of slapstick that earns the length. Stanley Kramer's biggest swing."
  },
  {
    title: "If....",
    director: "Lindsay Anderson",
    year: 1968,
    note: "British boarding school as society in miniature, the third act as armed revolt. Malcolm McDowell announces himself."
  },
  {
    title: "THX 1138",
    director: "George Lucas",
    year: 1971,
    note: "Lucas's first feature. Antiseptic dystopia in stark white, Robert Duvall as the prisoner waking up to a world that won't let him leave."
  },
  {
    title: "The Godfather",
    director: "Francis Ford Coppola",
    year: 1972,
    note: "Coppola, Brando, Pacino, Gordon Willis lighting from above. American epic about family, then about everything else."
  },
  {
    title: "Jeremiah Johnson",
    director: "Sydney Pollack",
    year: 1972,
    note: "Redford as a mountain man choosing the wilderness, then learning what the wilderness costs. Quiet, slow, indelible."
  },
  {
    title: "A Boy and His Dog",
    director: "L.Q. Jones",
    year: 1975,
    note: "Post-apocalyptic teen and his telepathic dog Vic. Don Johnson before Miami Vice. The ending is one of cinema's coldest punchlines."
  },
  {
    title: "Dog Day Afternoon",
    director: "Sidney Lumet",
    year: 1975,
    note: "Pacino in a Brooklyn bank, hostages he likes more than he should, August heat in every frame. 'Attica! Attica!'"
  },
  {
    title: "Monty Python and the Holy Grail",
    director: "Terry Gilliam, Terry Jones",
    year: 1975,
    note: "Coconuts for hooves. Made on a Pink Floyd accountant's budget. Still the funniest film in English."
  },
  {
    title: "The Deer Hunter",
    director: "Michael Cimino",
    year: 1978,
    note: "Pennsylvania steel town, Vietnam, the Russian-roulette scenes that broke ratings boards. De Niro and Walken as friends from one war to the next."
  },
  {
    title: "Alien",
    director: "Ridley Scott",
    year: 1979,
    note: "Haunted house in space, with H.R. Giger as the architect. Ripley as the working class who didn't sign up for this."
  },
  {
    title: "Time Bandits",
    director: "Terry Gilliam",
    year: 1981,
    note: "A boy and six time-traveling dwarves. Sean Connery as Agamemnon, Ralph Richardson as the Supreme Being. The ending is the bravest in family cinema."
  },
  {
    title: "Blade Runner",
    director: "Ridley Scott",
    year: 1982,
    note: "Rain-soaked future LA, replicants asking the questions only humans should. 'Tears in rain' is the most-quoted improvised monologue in genre."
  },
  {
    title: "The Last Starfighter",
    director: "Nick Castle",
    year: 1984,
    note: "Trailer-park teenager beats an arcade game, gets recruited to fight an actual interstellar war. Early CGI you can still admire."
  },
  {
    title: "Birdy",
    director: "Alan Parker",
    year: 1984,
    note: "Vietnam vet thinks he's a bird; his friend tries to talk him down. Cage and Modine as two damaged kids from Philly. Peter Gabriel scored it."
  },
  {
    title: "The Terminator",
    director: "James Cameron",
    year: 1984,
    note: "Cameron on a Roger Corman budget, Schwarzenegger as the unstoppable thing. The chase movie that paid for everything after."
  },
  {
    title: "Brazil",
    director: "Terry Gilliam",
    year: 1985,
    note: "Gilliam's dystopia of bureaucracy, ductwork, and dreams. Universal cut it; the director's cut won. The original sci-fi black comedy."
  },
  {
    title: "Ferris Bueller's Day Off",
    director: "John Hughes",
    year: 1986,
    note: "A perfect day in Chicago, Cameron Frye in the back seat, a Ferrari going the wrong way. The teen movie all teen movies still steal from."
  },
  {
    title: "Labyrinth",
    director: "Jim Henson",
    year: 1986,
    note: "Bowie as the Goblin King, Henson's puppets at peak craft, Jennifer Connelly figuring out the maze. The fairy tale '80s kids never got over."
  },
  {
    title: "The Lost Boys",
    director: "Joel Schumacher",
    year: 1987,
    note: "Vampires on the Santa Cruz boardwalk, Kiefer Sutherland with frosted tips, the Frog brothers. 'Sleep all day. Party all night. Never grow old.'"
  },
  {
    title: "The Princess Bride",
    director: "Rob Reiner",
    year: 1987,
    note: "Goldman adapting his own novel. A fairy tale framed by a grandfather reading it. Inconceivably quotable, deceptively well-made."
  },
  {
    title: "Cinema Paradiso",
    director: "Giuseppe Tornatore",
    year: 1988,
    note: "A Sicilian boy, a projectionist named Alfredo, and the kissing scenes that got cut. Morricone's score earns every tear."
  },
  {
    title: "Jacob's Ladder",
    director: "Adrian Lyne",
    year: 1990,
    note: "Vietnam vet hallucinating in New York, or maybe not. Tim Robbins lost in a city of demons. The horror that earned its twist."
  },
  {
    title: "Stanno Tutti Bene (Everybody's Fine)",
    director: "Giuseppe Tornatore",
    year: 1990,
    note: "Marcello Mastroianni as a Sicilian widower visiting his grown children across Italy. Tornatore returns to family as the only real subject."
  },
  {
    title: "Night on Earth",
    director: "Jim Jarmusch",
    year: 1991,
    note: "Five cab rides in five cities in one night. Roberto Benigni's monologue alone justifies the runtime. Tom Waits soundtrack."
  },
  {
    title: "Buffy the Vampire Slayer",
    director: "Fran Rubel Kuzui",
    year: 1992,
    note: "The Whedon-written original, before the show fixed everything that was wrong with it. Donald Sutherland, Paul Reubens dying for ten minutes."
  },
  {
    title: "Pulp Fiction",
    director: "Quentin Tarantino",
    year: 1994,
    note: "Non-linear, profane, and the dialogue you can still recite. Travolta and Jackson at the diner, Uma at the dance contest."
  },
  {
    title: "Léon: The Professional",
    director: "Luc Besson",
    year: 1994,
    note: "Reno as the hitman, Portman as the orphan he reluctantly adopts, Oldman as the rogue DEA agent chewing scenery. 'No women, no kids.'"
  },
  {
    title: "12 Monkeys",
    director: "Terry Gilliam",
    year: 1995,
    note: "Bruce Willis as a time traveler who can't tell what's real. Brad Pitt twitching his way to an Oscar nomination. Gilliam's most coherent paranoia."
  },
  {
    title: "Fargo",
    director: "Joel Coen, Ethan Coen",
    year: 1996,
    note: "Frances McDormand as a pregnant police chief in a North Dakota winter, William H. Macy unraveling. The Coens at peak voice."
  },
  {
    title: "The Fifth Element",
    director: "Luc Besson",
    year: 1997,
    note: "Besson's space opera with Jean-Paul Gaultier dressing it. Bruce Willis as the cab driver, Milla Jovovich as the supreme being, Gary Oldman wearing a half-haircut."
  },
  {
    title: "The Big Lebowski",
    director: "Joel Coen, Ethan Coen",
    year: 1998,
    note: "The Dude abides. Mistaken identity, bowling, a ferret in a bath. Endlessly quoted, endlessly rewatched, somehow new every time."
  },
  {
    title: "Run Lola Run",
    director: "Tom Tykwer",
    year: 1998,
    note: "Twenty minutes to save Manni, three different runs through Berlin. Franka Potente as kinetic force. Edited like an album side."
  },
  {
    title: "Memento",
    director: "Christopher Nolan",
    year: 2000,
    note: "Nolan's breakout. Told backwards, in black-and-white forward narration. Guy Pearce hunting his wife's killer with no short-term memory."
  },
  {
    title: "O Brother, Where Art Thou?",
    director: "Joel Coen, Ethan Coen",
    year: 2000,
    note: "Homer's Odyssey set in Depression-era Mississippi, Clooney as a chain-gang escapee, T Bone Burnett curating the soundtrack of a generation."
  },
  {
    title: "Donnie Darko",
    director: "Richard Kelly",
    year: 2001,
    note: "Tangent universes, a man in a bunny suit, Gyllenhaal's pre-fame breakout. Octopus of references, somehow holds together."
  },
  {
    title: "A.I. Artificial Intelligence",
    director: "Steven Spielberg",
    year: 2001,
    note: "Kubrick's project, finished by Spielberg. A robot boy who wants his mother's love. The ending divides the room and probably always will."
  },
  {
    title: "Vanilla Sky",
    director: "Cameron Crowe",
    year: 2001,
    note: "Cruise as a charmed New York publisher whose face — and life — falls apart. Cameron Diaz's monologue earns the price of admission."
  },
  {
    title: "Kill Bill: Vol. 1",
    director: "Quentin Tarantino",
    year: 2003,
    note: "Tarantino's love letter to kung-fu, samurai, and revenge cinema. The Crazy 88, the House of Blue Leaves, the yellow tracksuit."
  },
  {
    title: "Kill Bill: Vol. 2",
    director: "Quentin Tarantino",
    year: 2004,
    note: "The talkier half. Pai Mei, Budd in the trailer, the truth about her daughter. Tarantino's most sincere ending."
  },
  {
    title: "Garden State",
    director: "Zach Braff",
    year: 2004,
    note: "Braff returning to New Jersey for his mother's funeral, the Shins playing in headphones, Natalie Portman as the character that named the trope."
  },
  {
    title: "Eternal Sunshine of the Spotless Mind",
    director: "Michel Gondry",
    year: 2004,
    note: "Carrey and Winslet trying to erase each other and changing their minds mid-procedure. Charlie Kaufman screenplay; Gondry's practical effects."
  },
  {
    title: "The Man from Earth",
    director: "Richard Schenkman",
    year: 2007,
    note: "Single set, single conversation, one professor explaining to his colleagues he's 14,000 years old. Made for nothing, dense as a novel."
  },
  {
    title: "WALL-E",
    director: "Andrew Stanton",
    year: 2008,
    note: "First act is a silent film about a trash-compactor robot falling in love. The rest is the corporation-killed-Earth indictment Pixar slipped in past everyone."
  },
  {
    title: "Moon",
    director: "Duncan Jones",
    year: 2009,
    note: "Sam Rockwell alone on a lunar mining base, growing more alone. Kevin Spacey voicing the AI. Made on a shoestring, plays bigger than blockbusters."
  },
  {
    title: "District 9",
    director: "Neill Blomkamp",
    year: 2009,
    note: "South African apartheid as alien-refugee documentary. Sharlto Copley as the bureaucrat losing his humanity, literally. Made for under $30M."
  },
  {
    title: "Hanna",
    director: "Joe Wright",
    year: 2011,
    note: "Saoirse Ronan as a teenage assassin raised in the Arctic. Chemical Brothers score, Cate Blanchett as the villain. Pure cinema craft."
  },
  {
    title: "Source Code",
    director: "Duncan Jones",
    year: 2011,
    note: "Jake Gyllenhaal reliving the same eight minutes on a doomed train. Duncan Jones again proving small premises can carry big films."
  },
  {
    title: "John Wick",
    director: "Chad Stahelski",
    year: 2014,
    note: "They killed his dog. Keanu Reeves wakes the underworld. Stahelski's stuntman background reinvented American action choreography."
  },
  {
    title: "John Wick: Chapter 2",
    director: "Chad Stahelski",
    year: 2017,
    note: "Rome catacombs, mirror-maze shootouts, Common as a rival. The world-building blooms; Keanu keeps shooting."
  },
  {
    title: "John Wick: Chapter 3 – Parabellum",
    director: "Chad Stahelski",
    year: 2019,
    note: "Halle Berry's dog handlers, motorcycle sword fights, Casablanca by way of Manhattan. Stahelski going bigger without losing the line."
  },
  {
    title: "The Map of Tiny Perfect Things",
    director: "Ian Samuels",
    year: 2021,
    note: "Time-loop teen romance about finding the small moments. Kathryn Newton and Kyle Allen anchoring a film smarter than its premise suggests."
  },
  {
    title: "John Wick: Chapter 4",
    director: "Chad Stahelski",
    year: 2023,
    note: "Sacré-Cœur, Berlin, Osaka, and the longest stair sequence in action cinema. The sendoff Wick earned."
  }
];
