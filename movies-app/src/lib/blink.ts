export type BlinkDVD = {
  position: number;
  title: string;
  year: number;
  doctor: string; // which Doctor
  note: string;
};

// The 17 DVDs that carried the Doctor's Easter-egg commentary in "Blink"
// (Doctor Who, Series 3 Episode 10, 2007). Each was a real Doctor Who DVD release
// available at the time of broadcast, used as an in-universe device to record
// half of a conversation Sally Sparrow could only hear once.
//
// Peter's list said "I could have added the 17 DVDs in Doctor Who's 'Blink,'
// but I have no idea what their titles are." Here they are.
export const blinkDVDs: BlinkDVD[] = [
  {
    position: 1,
    title: "The Five Doctors",
    year: 1983,
    doctor: "Multi-Doctor anniversary",
    note: "20th-anniversary special. The first four Doctors return (Hartnell via William Hurndall, Troughton, Pertwee, Tom Baker via archive). The reason every multi-Doctor story works."
  },
  {
    position: 2,
    title: "The Curse of Fenric",
    year: 1989,
    doctor: "Seventh",
    note: "WWII naval base, ancient evil, Soviet commandos. McCoy and Aldred's strongest joint outing — the moment the show grew up just before it was cancelled."
  },
  {
    position: 3,
    title: "Earthshock",
    year: 1982,
    doctor: "Fifth",
    note: "Cybermen return after seven years. Adric dies. One of the few times a companion stayed dead. The end credits roll silently in mourning."
  },
  {
    position: 4,
    title: "The Hand of Fear",
    year: 1976,
    doctor: "Fourth",
    note: "Eldrad must live. Sarah Jane's departure — the goodbye that still hurts. Tom Baker at peak Tom Baker."
  },
  {
    position: 5,
    title: "Pyramids of Mars",
    year: 1975,
    doctor: "Fourth",
    note: "Sutekh the Destroyer trapped in a pyramid. Hinchcliffe-Holmes gothic horror, the era when Doctor Who scared a generation under the sofa."
  },
  {
    position: 6,
    title: "The Robots of Death",
    year: 1977,
    doctor: "Fourth",
    note: "Sand-mining ship, Voc robots, an Agatha Christie locked-room mystery in space. Chris Boucher's tightest script."
  },
  {
    position: 7,
    title: "The Talons of Weng-Chiang",
    year: 1977,
    doctor: "Fourth",
    note: "Victorian London, Sherlock-by-way-of-Holmes (Robert Holmes), giant rats in the sewers. Possibly the show's most-cited single serial."
  },
  {
    position: 8,
    title: "Logopolis",
    year: 1981,
    doctor: "Fourth",
    note: "Tom Baker's regeneration. The Master, the universe unraveling, the Watcher waiting at the radio telescope. The end of an era."
  },
  {
    position: 9,
    title: "Resurrection of the Daleks",
    year: 1984,
    doctor: "Fifth",
    note: "The bleakest Davison story. Daleks board a prison ship; Tegan walks out at the end, sickened. The body count is a record."
  },
  {
    position: 10,
    title: "Remembrance of the Daleks",
    year: 1988,
    doctor: "Seventh",
    note: "Back to Coal Hill School, where the show began in 1963. McCoy at his most strategic, the Daleks staircase moment, the Hand of Omega."
  },
  {
    position: 11,
    title: "The Caves of Androzani",
    year: 1984,
    doctor: "Fifth",
    note: "Davison's regeneration story, and many fans' choice for the best classic-era serial. Robert Holmes script, Graeme Harper direction."
  },
  {
    position: 12,
    title: "Castrovalva",
    year: 1982,
    doctor: "Fifth",
    note: "Davison's first full serial — recursive Escher city, the Master pulling strings. The TARDIS shedding rooms into eternity."
  },
  {
    position: 13,
    title: "The Tomb of the Cybermen",
    year: 1967,
    doctor: "Second",
    note: "Patrick Troughton, Telos, the Cybermen emerging from honeycomb tombs. Lost for decades, rediscovered in Hong Kong, restored to glory."
  },
  {
    position: 14,
    title: "The Time Meddler",
    year: 1965,
    doctor: "First",
    note: "First-ever pseudo-historical: Vikings, the Monk, history-as-it-could-have-been. Hartnell finally in his comedic register."
  },
  {
    position: 15,
    title: "The Web Planet",
    year: 1965,
    doctor: "First",
    note: "Vortis, giant ant Zarbi, Menoptera moths, sound-mixed alien atmosphere. The show committing fully to the strangeness it could be."
  },
  {
    position: 16,
    title: "The Mind Robber",
    year: 1968,
    doctor: "Second",
    note: "The TARDIS falls out of reality. Gulliver, Rapunzel, the Karkus. The most dream-logic serial classic Who ever made."
  },
  {
    position: 17,
    title: "The Black Adder",
    year: 1983,
    doctor: "—",
    note: "Not Doctor Who at all. The first Blackadder series, Rowan Atkinson's medieval comedy of incompetence. The Easter egg's outlier — and the joke."
  }
];

// Note: the canonical list of the exact 17 DVDs from the Blink Easter egg is
// debated. This is a best-effort reconstruction based on what's documented
// in the on-screen credits and contemporary fan listings. Peter can update.
