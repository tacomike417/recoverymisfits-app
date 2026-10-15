/* SOBER GANGSTER — the cards. Written by ChatGPT in Mike's voice (14 Oct 2026), approved by Mike.
   NIGHTS: 'Life on Life's Terms' — what happened in the 8 hours you slept. One shows every morning.
   like(s) = how much more likely this card is tonight (each card starts at 1; -1 means it can't happen).
   SCENARIOS: one hits every morning when nothing is hanging over you. Your 3 moves deal with it.
   For each move: h heat, c cash, s stress, n connection, end = it ends the scenario. Work pays your job's wage instead of c. */
const NIGHTS = [
  { id: 'n01', title: "THE USING DREAM", text: "You had six months clean in your dream. Then you didn't. Woke up tasting something that wasn't there, and it took a full minute to remember which life you were living.", heat: 8, stress: 12, like: s => (s.daysSinceSupport>=2?3:0)+(s.stress>60?2:0)+(s.connection<25?2:0) },
  { id: 'n02', title: "3:17 AM", text: "Your phone lit up. The plug. \"You still around?\" Four words from a number you should've deleted before you bought the phone.", heat: 15, stress: 10, like: s => s.items.includes('phone')?((s.supportToday?0:2)+(s.connection<30?2:0)+(s.flags.includes('oldcontact')?3:0)):-1 },
  { id: 'n03', title: "THE COP DREAM", text: "You were back in the backseat. Same plastic seat, same smell, same sound of somebody reading your rights like they were ordering lunch. Woke up reaching for handcuffs that weren't there.", heat: 5, stress: 15, like: s => (s.heat>40?3:0)+(s.flags.includes('warrant')?2:0)+(s.stress>50?1:0) },
  { id: 'n04', title: "EIGHT HOURS OF NOTHING", text: "No dreams. No panic. No waking up to check the door. Just eight hours of sleep like somebody who doesn't owe the whole world an explanation.", heat: -8, stress: -15, like: s => (s.supportToday?3:0)+(s.connection>60?2:0)+(s.stress<35?2:0) },
  { id: 'n05', title: "THE PHONE WOULDN'T SHUT UP", text: "Three people wanted money. One wanted a ride. Somebody you haven't seen in two years wanted to know if you were awake. Nobody asked how you were doing.", heat: 4, stress: 12, like: s => s.items.includes('phone')?((s.cash>100?2:0)+(s.connection>40?1:0)):-1 },
  { id: 'n06', title: "THE OLD APARTMENT", text: "You dreamed about that filthy apartment with the mattress on the floor. In the dream, you wanted to stay. That's the part you're not telling anybody.", heat: 10, stress: 12, like: s => (s.daysSinceSupport>=3?3:0)+(s.connection<20?2:0)+(s.stress>65?2:0) },
  { id: 'n07', title: "SOMEBODY CHECKED ON YOU", text: "A text came in before bed. \"Proud of you. See you tomorrow.\" You read it three times. Nobody was asking you for a damn thing.", heat: -6, stress: -8, like: s => (s.supportToday?3:0)+(s.connection>50?2:0) },
  { id: 'n08', title: "THE CEILING WON", text: "You laid there counting every mistake you've made since 1998. Around 4 AM your brain started bringing up things from third grade. Apparently the committee has unlimited funding.", heat: 5, stress: 15, like: s => (s.stress>70?3:0)+(s.scen?1:0)+(s.supportToday?0:1) },
  { id: 'n09', title: "THE FIRST GOOD MORNING", text: "You woke up before the alarm. Coffee tasted good. Nobody was looking for you, and for once that didn't feel like loneliness.", heat: -10, stress: -12, like: s => (s.streak>=3?4:0)+(s.stress<40?1:0)+(s.connection>55?1:0)+(s.scen?0:1) },
  { id: 'n10', title: "THE CHATTER", text: "Your head started talking at midnight. You're behind. You're broke. Everybody else figured life out. Same old liar, new material.", heat: 6, stress: 14, like: s => (s.cash<30?3:0)+(s.stress>55?1:0) },
  { id: 'n11', title: "A NAME FROM THE GRAVEYARD", text: "You dreamed about somebody who didn't make it. They looked exactly how you remembered them. You woke up with their name in your mouth and a whole lot you never got to say.", heat: -3, stress: 12, like: s => (s.supportToday?1:0)+(s.stress>60?1:0) },
  { id: 'n12', title: "NO SIRENS TONIGHT", text: "A car slowed down outside your window. Your stomach dropped before your eyes opened. It was somebody delivering pizza two houses down. You stayed awake another hour anyway.", heat: 7, stress: 10, like: s => (s.heat>45?3:0)+(s.flags.includes('warrant')?2:0) },
];
const SCENARIOS = [
  { id: "plug", title: "THE PLUG STILL HAS YOUR NUMBER", tag: "OLD LIFE PULLING \u00b7 HIGH RISK", setup: "You wake up to a text from a number you know better than your mother's. \"Got something for you. No charge.\" Free was always the most expensive word in your vocabulary.", now: 12, daily: 8, days: 3,
    expire: { h: 15, s: 15, n: -5, text: "The offer disappears." },
    moves: {
    work: { h: -3, c: 80, s: 8, n: -3, end: false, gain: "$80 in wages.", lose: "A day without confronting the message. The number stays in your phone.", say: "You made eighty bucks. The message is still sitting there, waiting for a weaker version of you." },
    rest: { h: -5, c: 0, s: -12, n: -2, end: false, gain: "A little control over the next hour.", lose: "Time. The message remains unread but undeleted.", say: "You put the phone face down. It takes more than a deep breath to bury a whole other life." },
    responsibility: { h: -12, c: -20, s: 8, n: 0, end: true, gain: "Plug's number blocked. Old contact flag removed.", lose: "$20 replacing the SIM and cleaning up your accounts.", say: "New number. Same brain. At least now the phone isn't doing half the damage." },
    support: { h: -20, c: 0, s: -8, n: 12, end: true, gain: "A trusted recovery contact.", lose: "Privacy. Somebody knows exactly how close this got.", say: "You told somebody the truth before it became a police report." },
    help: { h: -15, c: -10, s: -5, n: 8, end: true, gain: "Friend helps you block the number and stays with you.", lose: "$10 buying coffee and a meal while you talk it through.", say: "You showed them the message. No speech. They just sat down beside you." },
    job: { h: -5, c: -40, s: 10, n: 3, end: false, gain: "Interview clothes and a job lead.", lose: "$40 and the illusion that staying busy alone fixes everything.", say: "You bought a shirt for an interview. The plug doesn't care what you're wearing." }
    } },
  { id: "crew", title: "THE BOYS ARE BACK", tag: "OLD LIFE PULLING \u00b7 HIGH RISK", setup: "Your old crew spotted you walking home. They pulled up laughing, windows down, music shaking the street. \"Get in, man. We ain't doing nothing.\" You've heard that sentence before every bad night of your life.", now: 10, daily: 7, days: 4,
    expire: { h: 12, s: 10, n: -8, text: "They stop inviting you, but the connection remains unresolved." },
    moves: {
    work: { h: -4, c: 75, s: 8, n: -4, end: false, gain: "$75.", lose: "An opportunity to establish a boundary.", say: "You're working. They're still cruising the same three blocks." },
    rest: { h: -5, c: 0, s: -10, n: -2, end: false, gain: "Enough composure to walk away today.", lose: "Time. They'll probably ask again.", say: "You kept walking. Pride wanted you to turn around and explain yourself." },
    responsibility: { h: -15, c: -25, s: 6, n: -3, end: true, gain: "New bus route that avoids their hangout.", lose: "$25 transportation cost and easy access to the neighborhood.", say: "The long way home costs more. The short way costs everything." },
    support: { h: -20, c: 0, s: -5, n: 12, end: true, gain: "A recovery friend willing to meet you after work.", lose: "The old crew's invitation. Old crew contact flag removed.", say: "You picked people who want to see you alive tomorrow." },
    help: { h: -12, c: -15, s: -4, n: 10, end: true, gain: "A reliable ride home from a friend.", lose: "$15 gas money and the ability to pretend you don't need anyone.", say: "You asked for a ride. Your ego walked home alone." },
    job: { h: -10, c: -30, s: 10, n: 4, end: true, gain: "A lead on a job across town.", lose: "$30 travel and application expenses, plus the old crew's approval.", say: "Different schedule. Different neighborhood. Same name, different ending." }
    } },
  { id: "electric", title: "THE ELECTRIC BILL", tag: "MONEY \u00b7 SURVIVAL", setup: "You finally got a room of your own. Now there's a shutoff notice taped to the door. $147 due, and the refrigerator is the only thing in the apartment that sounds like it has its shit together.", now: 6, daily: 5, days: 4,
    expire: { h: 8, s: 20, n: -5, text: "Power shut off." },
    moves: {
    work: { h: -4, c: 90, s: 12, n: -3, end: false, gain: "$90 toward the bill.", lose: "A full day and some sleep.", say: "One shift down. Still fifty-seven bucks short." },
    rest: { h: -3, c: 0, s: -10, n: -2, end: false, gain: "Enough calm to read the actual notice.", lose: "A day without payment.", say: "The bill didn't get smaller. At least you stopped imagining it was six thousand dollars." },
    responsibility: { h: -12, c: -147, s: -8, n: 0, end: true, gain: "Electricity secured. Utility account current.", lose: "$147.", say: "Paid in full. The lights staying on shouldn't feel like winning the lottery, but here we are." },
    support: { h: -10, c: 0, s: -6, n: 8, end: false, gain: "A resource referral.", lose: "Time that could have been spent earning money.", say: "Somebody gave you a number for utility assistance. Now you've got to make the call." },
    help: { h: -14, c: -40, s: 5, n: 6, end: true, gain: "Emergency assistance covers the remaining $107 after your payment.", lose: "$40 and some pride.", say: "You asked before the lights went out. That's a new kind of survival." },
    job: { h: -6, c: -25, s: 8, n: 4, end: false, gain: "Interview for a higher-paying job.", lose: "$25 transportation and the immediate chance to earn wages.", say: "Better money next week doesn't keep the refrigerator running tonight." }
    } },
  { id: "car", title: "THE CAR THAT AIN'T YOURS YET", tag: "MONEY \u00b7 OPPORTUNITY", setup: "Your coworker has a beat-up Honda for $600. It starts, stops, and only makes one noise that sounds financially threatening. The bus has been eating two hours of your life every day.", now: 3, daily: 3, days: 5,
    expire: { h: 3, s: 7, n: 0, text: "Honda sold." },
    moves: {
    work: { h: -4, c: 100, s: 10, n: -2, end: false, gain: "$100 toward the car.", lose: "A day of personal time.", say: "Another hundred in the pile. Walking past the bus stop is starting to look possible." },
    rest: { h: -3, c: 0, s: -8, n: -2, end: false, gain: "Time to reconsider the purchase.", lose: "One day before somebody else buys it.", say: "It's a car, not a rescue helicopter. You can survive without it." },
    responsibility: { h: -12, c: -600, s: 5, n: 2, end: true, gain: "Used Honda item.", lose: "$600 and the comforting lie that the car won't need repairs.", say: "The keys are yours. The check engine light is also yours." },
    support: { h: -10, c: 0, s: -6, n: 8, end: false, gain: "A friend offers to inspect the car.", lose: "Time and a chance to buy it immediately.", say: "Your friend says the transmission sounds like a washing machine full of silverware." },
    help: { h: -8, c: -300, s: 6, n: 5, end: true, gain: "Honda item, with a $300 personal loan owed to a friend.", lose: "$300 cash and freedom from owing somebody money.", say: "You got wheels. Now you have a payment and somebody trusting you to make it." },
    job: { h: -10, c: -40, s: 12, n: 5, end: true, gain: "Job interview closer to home, removing the need for a car.", lose: "$40, the Honda opportunity, and the fantasy of cruising past the bus stop.", say: "You didn't get the car. You might've gotten something better: a job you can walk to." }
    } },
  { id: "shoes", title: "SHE DON'T DATE SCRUBS", tag: "LOVE \u00b7 ATTRACTION", setup: "That new girl with the phat ass has been paying attention to you. Then she looks down at your shoes and says, \"You seem cool, but I don't date scrubby boys in dingy shoes.\" Your sneakers have survived two rehabs, a county jail, and something nobody's identified yet.", now: 5, daily: 4, days: 4,
    expire: { h: 5, s: 12, n: -5, text: "Girl loses interest." },
    moves: {
    work: { h: -5, c: 85, s: 10, n: -2, end: false, gain: "$85 toward new shoes.", lose: "Time with the girl. She remains interested.", say: "You worked all day thinking about a woman and a pair of shoes. Recovery is getting expensive." },
    rest: { h: -5, c: 0, s: -10, n: -3, end: false, gain: "Some perspective.", lose: "A day of flirting.", say: "Maybe she's worth it. Maybe you just want somebody to think you're worth it." },
    responsibility: { h: -12, c: -90, s: -5, n: 4, end: true, gain: "Clean sneakers item. Girl remains interested.", lose: "$90.", say: "New kicks. Same feet. Now find out whether she likes the guy inside them." },
    support: { h: -20, c: 0, s: -10, n: 12, end: true, gain: "Stronger recovery connection.", lose: "Girl's interest. She moves on while you're getting your head straight. The old shoes stay.", say: "You spent the evening with people who don't give a damn what shoes you're wearing. She found somebody else. You're still standing." },
    help: { h: -12, c: -35, s: 4, n: 8, end: true, gain: "A friend helps you find decent secondhand sneakers. Girl agrees to a date.", lose: "$35 and the satisfaction of doing everything yourself.", say: "Your buddy hooked you up with some clean kicks. She gave you her number. You still owe him thirty-five bucks and a thank-you." },
    job: { h: -8, c: -50, s: 12, n: 3, end: false, gain: "Interview for a better-paying job. Girl remains interested for now.", lose: "$50 for interview clothes and transportation. Still wearing the busted shoes.", say: "You might be getting a better paycheck. She might be getting tired of waiting. Welcome to having priorities." }
    } },
  { id: "ex", title: "THE EX AT MIDNIGHT", tag: "LOVE / SEX \u00b7 TEMPTATION", setup: "Your ex sends a picture at 11:48 PM. You know that bedroom. You know that smile. You also know the last time you went over there, you woke up three days later missing your wallet, your phone, and a respectable amount of your dignity. She says she's changed. So did you.", now: 12, daily: 7, days: 3,
    expire: { h: 12, s: 15, n: -6, text: "The ex stops texting." },
    moves: {
    work: { h: -4, c: 85, s: 10, n: -4, end: false, gain: "$85 and a day of distance.", lose: "Time to deal with the invitation. Ex keeps texting.", say: "Eight hours of work. Twelve messages waiting. Apparently somebody has a lot of free time." },
    rest: { h: -6, c: 0, s: -12, n: -3, end: false, gain: "Enough distance to stop staring at the picture.", lose: "A day. The invitation remains open.", say: "You put the phone down. Picked it back up. Put it down again. Nobody said growing up was gonna look dignified." },
    responsibility: { h: -15, c: -15, s: 8, n: -5, end: true, gain: "Clear boundary. Ex's number blocked.", lose: "$15 changing your number and the possibility of getting back together.", say: "You blocked her. Then you sat there staring at a phone that wasn't ringing. Funny how doing the right thing can still feel like shit." },
    support: { h: -22, c: 0, s: -8, n: 12, end: true, gain: "A recovery friend who knows what's going on.", lose: "Ex's romantic interest. She doesn't wait around.", say: "You told somebody exactly what you were thinking. Not the cleaned-up version. The real one. She moved on. You didn't go backward." },
    help: { h: -18, c: -20, s: -5, n: 10, end: true, gain: "Friend takes you out for dinner and helps you through the night.", lose: "$20 and a little pride. Ex stops contacting you.", say: "Your friend sat across from you eating wings while you explained why this particular bad idea had such a good sales pitch." },
    job: { h: -7, c: -45, s: 10, n: 4, end: false, gain: "A job interview with evening hours.", lose: "$45 in clothes and transportation. Ex remains available.", say: "You're trying to build a future. Your phone keeps offering you a rerun." }
    } },
  { id: "mom", title: "MOM LEFT A VOICEMAIL", tag: "FAMILY \u00b7 TRUST", setup: "Your mother called. First time in four months. She says your little nephew has a birthday party Saturday, and everybody's going to be there. Then she gets quiet and says, \"Please don't make me regret inviting you.\" That one landed harder than it should've.", now: 5, daily: 5, days: 4,
    expire: { h: 8, s: 18, n: -12, text: "Mom stops asking." },
    moves: {
    work: { h: -4, c: 80, s: 12, n: -5, end: false, gain: "$80 toward a birthday gift and transportation.", lose: "A day without returning Mom's call.", say: "You made eighty bucks. Mom still doesn't know if you're coming. Money was never the only thing she wanted." },
    rest: { h: -5, c: 0, s: -12, n: -2, end: false, gain: "Enough calm to consider what you're actually afraid of.", lose: "Another day without answering.", say: "You rehearsed the conversation six times. Somehow every version ended with you hanging up." },
    responsibility: { h: -12, c: -35, s: 8, n: 10, end: true, gain: "Birthday gift item. Family invitation confirmed.", lose: "$35 and the comfort of avoiding your family.", say: "You bought the kid a present and called your mother back. She said, \"Okay, honey.\" Two words. You almost lost it." },
    support: { h: -20, c: 0, s: -10, n: 12, end: true, gain: "A recovery friend and stronger boundaries with family.", lose: "The birthday party. You decide you're not ready for that room yet.", say: "You talked it through and called Mom. Told her you weren't ready. She was disappointed. You were honest. Both things can be true." },
    help: { h: -15, c: -20, s: -5, n: 12, end: true, gain: "Friend agrees to drive you to the party and pick you up. Family invitation confirmed.", lose: "$20 gas money and the ability to pretend you're completely independent.", say: "You asked somebody to be your exit plan. Not because you plan on screwing up. Because you've finally learned you don't have to do everything alone." },
    job: { h: -8, c: -40, s: 10, n: 4, end: false, gain: "Interview for a job with a stable schedule.", lose: "$40 in interview expenses and time with family.", say: "You're trying to become somebody your family can count on. Right now they're still waiting for you to return a phone call." }
    } },
  { id: "warrant", title: "THE BENCH WARRANT", tag: "LAW / COURT \u00b7 HIGH RISK", setup: "You missed a court date three months ago. Thought maybe it disappeared into the system. Then a letter shows up with your name, a case number, and the kind of language that means somebody with a badge might be interested in your whereabouts. Turns out ignoring the government doesn't make the government ignore you.", now: 20, daily: 12, days: 3,
    expire: { h: 25, s: 25, n: -10, text: "Warrant remains active." },
    moves: {
    work: { h: -3, c: 90, s: 15, n: -5, end: false, gain: "$90 toward legal expenses.", lose: "Another day without addressing the warrant.", say: "You made ninety bucks. The warrant doesn't accept overtime as an excuse." },
    rest: { h: -5, c: 0, s: -12, n: -3, end: false, gain: "Enough composure to read the paperwork.", lose: "One day closer to a possible arrest.", say: "You stopped panicking long enough to find the courthouse phone number. Now comes the part where you actually call it." },
    responsibility: { h: -30, c: -150, s: 12, n: 2, end: true, gain: "Court appearance arranged with legal guidance. Warrant issue flagged as being addressed.", lose: "$150 for transportation, paperwork, and legal assistance.", say: "You called, got legal advice, and started handling the mess. The warrant isn't magically gone. But now there's a plan that doesn't involve hiding behind curtains." },
    support: { h: -22, c: 0, s: -8, n: 15, end: false, gain: "A recovery friend willing to accompany you to court.", lose: "Time. The warrant is still active.", say: "They'll sit beside you in court. They can't make the judge disappear. That's probably for the best." },
    help: { h: -25, c: -60, s: 8, n: 12, end: true, gain: "Legal aid referral, courthouse transportation, and help arranging a court appearance.", lose: "$60 in expenses and your ability to keep the situation secret.", say: "You told somebody about the warrant before the cops told them for you. That's progress nobody puts on a motivational poster." },
    job: { h: -5, c: -45, s: 15, n: 3, end: false, gain: "Interview for a better job.", lose: "$45 in expenses and another day without dealing with court.", say: "You might get hired. You might get arrested before your first paycheck. Your calendar needs some serious rearranging." }
    } },
  { id: "bigray", title: "BIG RAY WANTS HIS MONEY", tag: "SOBER HOUSE \u00b7 EXPLOITATION", setup: "Big Ray, your old sober house landlord, calls you out of nowhere. Says you owe him $200 for \"damages\" from when you moved out. You remember leaving that room cleaner than you found it, which wasn't difficult considering the carpet had its own ecosystem. He says pay up or he'll start calling people.", now: 10, daily: 6, days: 4,
    expire: { h: 12, s: 18, n: -10, text: "Big Ray contacts a reference and makes unsupported allegations." },
    moves: {
    work: { h: -4, c: 85, s: 12, n: -3, end: false, gain: "$85 toward the alleged debt.", lose: "A day without challenging the charge.", say: "You worked eight hours to pay a man who once charged you twenty bucks for a missing fork." },
    rest: { h: -5, c: 0, s: -12, n: -2, end: false, gain: "Enough calm not to call Ray back screaming.", lose: "Another day while he keeps threatening you.", say: "You counted to ten. Then twenty. Then considered counting how many health codes that house violated." },
    responsibility: { h: -18, c: -25, s: 10, n: 4, end: true, gain: "Written dispute, saved evidence, and documentation of the charges.", lose: "$25 in transportation, copying, and mailing expenses. Big Ray's goodwill, assuming he ever had any.", say: "You asked for an itemized bill in writing. Big Ray suddenly got very interested in ending the conversation." },
    support: { h: -20, c: 0, s: -8, n: 12, end: true, gain: "Recovery community support and a witness familiar with the house.", lose: "The option of keeping the dispute private.", say: "You talked to somebody who lived there too. Turns out Big Ray has been charging everybody for the same broken dresser." },
    help: { h: -22, c: -15, s: -5, n: 10, end: true, gain: "Tenant advocacy referral and help disputing the charge.", lose: "$15 in transportation and a day dealing with paperwork.", say: "Somebody explained that Big Ray doesn't get to invent debts because he owns a clipboard." },
    job: { h: -6, c: -40, s: 12, n: 5, end: false, gain: "Interview with an employer unconnected to Big Ray.", lose: "$40 and another day of unanswered threats.", say: "You're trying to build a life where Big Ray doesn't get a vote. He's still blowing up your phone." }
    } },
  { id: "respect", title: "DON'T TALK TO ME LIKE THAT", tag: "PRIDE / RESPECT \u00b7 EGO", setup: "Some young dude at work calls you a loser in front of everybody. Says people like you never amount to shit. The whole room goes quiet, and you feel that old part of you waking up. The part that used to solve disrespect with fists and spend the next six months explaining it to a judge.", now: 12, daily: 7, days: 3,
    expire: { h: 18, s: 20, n: -8, text: "The conflict blows up into a loud workplace argument." },
    moves: {
    work: { h: -5, c: 90, s: 12, n: -4, end: false, gain: "$90 and another day of employment.", lose: "A day without settling the workplace conflict.", say: "You kept your head down and collected your paycheck. He still thinks he's funny. Your fists still think they have an opinion." },
    rest: { h: -8, c: 0, s: -15, n: -3, end: false, gain: "Enough control to walk away from the confrontation.", lose: "Time and the satisfaction of getting the last word.", say: "You walked away. He laughed. Your ego filed a formal complaint with absolutely nobody." },
    responsibility: { h: -18, c: -20, s: 8, n: 5, end: true, gain: "Workplace incident documented. Supervisor agrees to address the behavior.", lose: "$20 in missed wages while you deal with management.", say: "You went to the boss instead of the parking lot. Nobody clapped. Nobody got arrested either." },
    support: { h: -22, c: 0, s: -10, n: 15, end: true, gain: "A recovery friend and a new way to handle disrespect.", lose: "The chance to settle the score. Coworker still doesn't apologize.", say: "You told your people how close you came to swinging. They didn't tell you that you were weak. They reminded you what the last punch cost." },
    help: { h: -15, c: -30, s: -6, n: 10, end: true, gain: "A trusted coworker agrees to help resolve the conflict.", lose: "$30 in missed wages and the illusion that you have to handle every problem yourself.", say: "Somebody stepped in before it got ugly. Your pride took a hit. Your criminal record didn't." },
    job: { h: -20, c: -50, s: 10, n: 6, end: true, gain: "Interview for a better job away from the hostile workplace.", lose: "$50 in expenses and your current job's guaranteed shifts. Coworker gets the last word.", say: "He can keep the break room and his big mouth. You're going somewhere that might actually pay you enough to tolerate idiots." }
    } },
];
// her version of the two love scenarios (girl homies)
const FEMALE = {
  shoes: { title: "HE DON'T DATE BUSTED SHOES", setup: "That new guy with the arms and the easy smile has been paying attention to you. Then he looks down at your shoes and says, \"You seem cool, but I don't date girls in busted, dingy shoes.\" Your sneakers have survived two rehabs, a county jail, and something nobody's identified yet.", swap: [[/\bgirl\b/g, 'guy'], [/\bGirl\b/g, 'Guy'], [/\bShe\b/g, 'He'], [/\bshe\b/g, 'he'], [/\bher number\b/g, 'his number'], [/the guy inside them/g, 'the girl inside them']] },
  ex: { setup: "Your ex sends a picture at 11:48 PM. You know that bedroom. You know that smile. You also know the last time you went over there, you woke up three days later missing your wallet, your phone, and a respectable amount of your dignity. He says he's changed. So did you.", swap: [[/\bShe\b/g, 'He'], [/\bshe\b/g, 'he'], [/blocked her/g, 'blocked him']] }
};
// what a scenario move can hand you (items go in your stuff; flags remember people)
const SCEN_GIVES = {
  'shoes.responsibility': { item: 'dunks', flag: 'girl' }, 'shoes.help': { item: 'dunks', flag: 'girl' },
  'car.responsibility': { item: 'car' }, 'car.help': { item: 'car', debt: 300 },
  'plug.responsibility': { unflag: 'oldcontact' }, 'plug.support': { unflag: 'oldcontact' }, 'plug.help': { unflag: 'oldcontact' },
  'crew.support': { unflag: 'oldcontact' }, 'warrant.responsibility': { unflag: 'warrant' }, 'warrant.help': { unflag: 'warrant' }
};
const SCEN_SETS = { plug: 'oldcontact', crew: 'oldcontact', warrant: 'warrant' };   // flags a scenario turns on when it lands

if (typeof module !== 'undefined') module.exports = { NIGHTS, SCENARIOS, FEMALE, SCEN_GIVES, SCEN_SETS };
