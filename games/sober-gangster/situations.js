/* SOBER GANGSTER v4 situations. Written by ChatGPT, approved by Mike (15 Oct 2026). Chapters 1-3. Generated from scratchpad v4/ch*.txt */
const SITUATIONS = [
{
"id": "empty_fridge",
"ch": 1,
"title": "TWELVE BUCKS AND A PRAYER",
"who": "shorty",
"setup": "You got twelve dollars, an empty stomach, and six days until rent. Shorty's eating cold spaghetti out of a coffee mug and offers you a fork.",
"now": 4,
"daily": 3,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Your stomach growled louder than the speaker."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops knows where they serve free breakfast."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": true,
"gives": [
"shared_meal"
],
"say": "You washed dishes. Shorty split his dinner."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "Sleeping through lunch ain't a meal plan."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"mom": 1
},
"end": true,
"gives": [
"job_search_point",
"food_pantry_lead"
],
"say": "You spent ten bucks chasing work. The receptionist gave you a food pantry address."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You told Shorty where to stick his spaghetti. Felt great. Still hungry."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_mom_stopped"
],
"say": "You ignored everybody. Your stomach didn't get the message."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You blew your money on nonsense. Hunger's coming back."
}
},
"expire": {
"h": 8,
"s": 15,
"c": 0,
"n": -5,
"trust": {
"shorty": -1
},
"say": "Two days hungry. Even your pride's looking edible."
}
},
{
"id": "ray_inspection",
"ch": 1,
"title": "BIG RAY'S WHITE GLOVE",
"who": "ray",
"setup": "Big Ray announces a surprise room inspection. There's a mystery stain on your mattress, and he's already talking about a fifty-dollar cleaning fee. You didn't make the stain, but apparently you inherited it.",
"now": 6,
"daily": 4,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You went to a meeting. Ray's still sniffing mattresses."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops said take pictures before you touch anything."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ray": 1
},
"end": true,
"gives": [
"clean_room",
"ray_respect"
],
"say": "You cleaned the whole room. Ray couldn't find a damn thing."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "Nice nap. Ray's clipboard didn't take one."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased a job lead. Ray kept the inspection scheduled."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"ray": -2,
"shorty": -2
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You called Ray a slumlord. His pen started moving."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1,
"ray": -1
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You shut your door. Ray wrote down the time."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You kicked the trash can. Ray added it to your bill."
}
},
"expire": {
"h": 12,
"s": 18,
"c": -50,
"n": -5,
"trust": {
"ray": -2
},
"say": "Ray charged fifty bucks for a stain older than your sobriety."
}
},
{
"id": "mom_voicemail",
"ch": 1,
"title": "MOM CALLED AGAIN",
"who": "mom",
"setup": "Three missed calls from Mom. Her voicemail says she just wants to hear your voice, but you know she's really checking whether you're still alive. Can't exactly blame her.",
"now": 5,
"daily": 4,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"mom": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You shared about Mom. Somebody handed you a tissue."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 2,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"mom_contact_restored"
],
"say": "You called back. She cried before you said hello."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": false,
"gives": [],
"say": "You helped Shorty. Mom's still waiting by the phone."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept through another call. That one's gonna sting."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You applied for work. Mom still wants to hear your voice."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"mom": -2,
"ray": -2,
"shorty": -2
},
"end": true,
"gives": [
"mom_hurt",
"receipt_family_argument"
],
"say": "You called back swinging. She hung up crying."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_mom_stopped"
],
"say": "You silenced her number. The quiet felt good. Briefly."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_mom_stopped"
],
"say": "You tossed the phone aside. Mom kept calling."
}
},
"expire": {
"h": 10,
"s": 15,
"c": 0,
"n": -10,
"trust": {
"mom": -2
},
"say": "Mom stopped calling. Somehow that's worse."
}
},
{
"id": "ghost_at_gate",
"ch": 1,
"title": "GHOST AT THE GATE",
"who": "ghost",
"setup": "Ghost is parked across from the sober house, engine running. He waves like you're old buddies meeting for coffee. Big Ray's watching from the porch, and you can feel your old life reaching through the fence.",
"now": 15,
"daily": 9,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": true,
"gives": [
"ghost_refused"
],
"say": "You walked straight past Ghost and into a meeting."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 2,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"ghost_refused"
],
"say": "Pops stayed on the phone until Ghost drove away."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ghost": -1
},
"end": true,
"gives": [
"ghost_refused",
"shorty_friend"
],
"say": "You helped Shorty move furniture. Ghost got tired of waiting."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You hid under the covers. Ghost knows where you sleep."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You went looking for work. Ghost was still parked outside."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"ray": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You yelled at Ray for watching. Ghost laughed from his car."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You ignored everybody. Ghost left another message."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"ghost_contact_active",
"receipt_ghost_message"
],
"say": "You got in the car. That relief has a price."
}
},
"expire": {
"h": 20,
"s": 20,
"c": 0,
"n": -10,
"trust": {
"ghost": 2,
"ray": -1,
"pops": -1
},
"say": "Ghost left his number under your door. You kept it."
}
},
{
"id": "shorty_laundry",
"ch": 1,
"title": "SOMEBODY STOLE MY DRAWERS",
"who": "shorty",
"setup": "Shorty's missing three pairs of underwear and accusing everybody in the house. He's got the whole hallway gathered like a crime scene. Big Ray says if the noise doesn't stop, everybody loses laundry privileges.",
"now": 5,
"daily": 4,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You left for a meeting. The underwear investigation continued."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops asked why you're involved in another man's underwear."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ray": 1
},
"end": true,
"gives": [
"shorty_friend",
"laundry_privileges"
],
"say": "You found his drawers behind the dryer. Case closed, Sherlock."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept through the trial. Apparently you were a suspect."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You applied for jobs. Shorty was still interrogating socks."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You called Shorty an idiot. He demanded a jury."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You shut your door. Shorty declared you suspicious."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You threw a laundry basket. Ray started writing."
}
},
"expire": {
"h": 10,
"s": 12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -1
},
"say": "Ray locked the laundry room. Everybody smells like consequences."
}
},
{
"id": "first_job",
"ch": 1,
"title": "DARLENE NEEDS A BODY",
"who": "shorty",
"setup": "Shorty says the warehouse down the road needs somebody immediately. The boss is named Darlene, and apparently she's fired half the county already. The interview's tomorrow morning, and your only decent shirt smells like the sober house kitchen.",
"now": 6,
"daily": 5,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You asked for courage at a meeting. The interview's still tomorrow."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [
"interview_advice"
],
"say": "Pops said show up early and keep your mouth shut."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": false,
"gives": [
"shorty_reference"
],
"say": "You helped Shorty first. He promised to put in a word."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You got some sleep. Darlene won't hire a zombie."
},
"betterjob": {
"h": 5,
"s": 8,
"c": 0,
"n": 2,
"trust": {
"mom": 1,
"darlene": 1
},
"end": true,
"gives": [
"first_job",
"work_unlocked",
"darlene_introduced"
],
"say": "You walked across town in the smelly shirt. Darlene looked you over. \"Monday. Six sharp. Don't be late.\""
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2,
"darlene": -2
},
"end": true,
"gives": [
"job_offer_lost",
"receipt_shorty_heard"
],
"say": "You mouthed off at the interview. Darlene showed you the door."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"missed_interview_warning"
],
"say": "You silenced your phone. The warehouse kept hiring."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"job_offer_lost",
"receipt_ghost_message"
],
"say": "You blew off the interview. Darlene hired somebody else."
}
},
"expire": {
"h": 15,
"s": 20,
"c": 0,
"n": -10,
"trust": {
"shorty": -2,
"mom": -1
},
"say": "The warehouse filled the position. You're still broke and unemployed."
}
},
{
"id": "darlene_raise",
"ch": 2,
"title": "DARLENE'S GOT AN OFFER",
"who": "darlene",
"setup": "Darlene pulls you aside after your shift. Says you've been showing up on time and she's got extra hours if you want them. More money sounds great until you remember you're already tired as hell.",
"now": 5,
"daily": 4,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You made the meeting. Darlene's offer can wait until morning."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops said more money won't fix a life you never show up for."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": false,
"gives": [],
"say": "You helped somebody move. Darlene still needs an answer."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You got some sleep. Your paycheck didn't grow overnight."
},
"work": {
"h": 6,
"s": 12,
"c": 100,
"n": -2,
"trust": {
"darlene": 2,
"ray": 1
},
"end": true,
"gives": [
"extra_shifts_unlocked",
"raise_progress"
],
"say": "You took the extra shift. Darlene noticed. Your feet filed a complaint."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": true,
"gives": [
"job_search_point",
"better_job_lead"
],
"say": "You chased a bigger paycheck. Darlene gave your hours to somebody else."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": true,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit instead. Darlene didn't beg you to stay."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"darlene": -2,
"ray": -2,
"shorty": -2
},
"end": true,
"gives": [
"raise_offer_lost",
"receipt_parking_lot"
],
"say": "You demanded more money. Darlene demanded you leave her office."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1,
"darlene": -1
},
"end": false,
"gives": [
"receipt_nobody_answers"
],
"say": "You ignored the offer. Darlene started asking somebody else."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"raise_offer_lost",
"receipt_ghost_message"
],
"say": "You blew your cash celebrating a raise you never got."
}
},
"expire": {
"h": 8,
"s": 12,
"c": 0,
"n": -5,
"trust": {
"darlene": -1
},
"say": "Darlene gave the hours away. Opportunity doesn't wait forever."
}
},
{
"id": "payday_pocket",
"ch": 2,
"title": "EIGHTY BUCKS AND BAD IDEAS",
"who": "ghost",
"setup": "Payday hits and you've got actual money in your pocket. Ghost texts, \"Heard you're doing good. Come celebrate.\" Your brain immediately opens a very creative accounting department.",
"now": 12,
"daily": 8,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": true,
"gives": [
"payday_protected"
],
"say": "You went to a meeting instead. The money stayed in your pocket."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 2,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"payday_protected"
],
"say": "Pops talked you through payday. Nobody needed a receipt."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ghost": -1
},
"end": true,
"gives": [
"payday_protected"
],
"say": "You spent the evening helping Shorty. Ghost spent it waiting."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept on the temptation. Ghost's message was still there."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1
},
"end": false,
"gives": [],
"say": "You earned another eighty. Now your bad ideas have a bigger budget."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased better work. Ghost kept texting your current paycheck."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1,
"ghost": 1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit with money in your pocket. That's a dangerous combination."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"ray": -2,
"darlene": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_parking_lot"
],
"say": "You snapped at everybody. Ghost sounded pretty reasonable afterward."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_nobody_answers"
],
"say": "You ignored your people. Ghost was the only one still texting."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"payday_blown",
"receipt_ghost_message"
],
"say": "Twenty bucks gone in a flash. The craving didn't leave with it."
}
},
"expire": {
"h": 18,
"s": 20,
"c": 0,
"n": -10,
"trust": {
"ghost": 2,
"pops": -1
},
"say": "You never answered Ghost. Your head kept answering for you."
}
},
{
"id": "shorty_borrow",
"ch": 2,
"title": "SHORTY NEEDS FORTY",
"who": "shorty",
"setup": "Shorty catches you coming home from work. Says he's forty bucks short on rent and Big Ray's already threatening his bed. He promises to pay you Friday, which is exactly what he said about the last ten dollars.",
"now": 6,
"daily": 5,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You went to a meeting. Shorty's still forty short."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops said helping ain't the same as financing somebody's chaos."
},
"help": {
"h": -8,
"s": -5,
"c": -40,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": true,
"gives": [
"shorty_rent_saved",
"shorty_owes_40"
],
"say": "You covered his forty. Shorty hugged you. Your wallet didn't."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You took a nap. Shorty knocked twice."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1,
"shorty": -1
},
"end": false,
"gives": [],
"say": "You earned eighty. Shorty watched you count it."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1,
"shorty": -1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You looked for better work. Shorty looked for somebody else."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1,
"shorty": -1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "Now you're both broke. Shorty wasn't impressed."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2,
"darlene": -2
},
"end": true,
"gives": [
"shorty_friend_damaged",
"receipt_shorty_heard"
],
"say": "You called Shorty a mooch. He called you worse."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You pretended not to hear him. He heard that loud and clear."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You wasted twenty bucks. Shorty still needs forty."
}
},
"expire": {
"h": 10,
"s": 15,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -1
},
"say": "Big Ray put Shorty's stuff in bags. You watched him carry them out."
}
},
{
"id": "ghost_warehouse",
"ch": 2,
"title": "GHOST AT THE LOADING DOCK",
"who": "ghost",
"setup": "Ghost is leaning against a car across from the warehouse when your shift ends. Says he was just passing through, even though he lives twenty minutes away. Darlene sees you talking and suddenly gets real interested in who your friends are.",
"now": 15,
"daily": 10,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": true,
"gives": [
"ghost_work_boundary"
],
"say": "You walked past Ghost and headed straight to a meeting."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 2,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"ghost_work_boundary"
],
"say": "Pops stayed on the phone while you walked to the bus."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ghost": -1
},
"end": true,
"gives": [
"ghost_work_boundary"
],
"say": "You helped a coworker load boxes. Ghost got bored waiting."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You went home and crashed. Ghost knows your work schedule now."
},
"work": {
"h": 6,
"s": 12,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1,
"ghost": 1
},
"end": false,
"gives": [],
"say": "You clocked another shift. Ghost showed up again at quitting time."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1,
"ghost": -1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You looked for another job. Ghost still knows where this one is."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1,
"ghost": 1
},
"end": true,
"gives": [
"unemployed",
"receipt_job_walkout",
"ghost_work_escape"
],
"say": "You quit to avoid Ghost. Now you got no paycheck and the same problem."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"darlene": -2,
"ray": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_parking_lot"
],
"say": "You screamed at Ghost in the parking lot. Darlene saw everything."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You ignored everybody. Ghost left a note on your windshield."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"ghost_contact_active",
"receipt_ghost_message"
],
"say": "You got in Ghost's car. Darlene watched you leave."
}
},
"expire": {
"h": 22,
"s": 20,
"c": 0,
"n": -12,
"trust": {
"ghost": 2,
"darlene": -2
},
"say": "Darlene wants a word about your parking lot visitors."
}
},
{
"id": "ray_rent_hike",
"ch": 2,
"title": "RAY SMELLS A PAYCHECK",
"who": "ray",
"setup": "Big Ray sees you coming home in your warehouse shirt and announces rent is now $140 a week. Says employed residents pay more because they can afford it. Funny how he knew about your raise before you did.",
"now": 8,
"daily": 6,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You prayed for patience. Ray's still counting your money."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops said get the rent terms in writing before you explode."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ray": 1
},
"end": false,
"gives": [],
"say": "You cleaned the kitchen. Ray still wants his hundred forty."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept on it. Rent didn't get cheaper."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1
},
"end": true,
"gives": [
"rent_140_accepted",
"rent_budget_started"
],
"say": "You worked another shift. Eighty bucks closer to Ray's hand."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1,
"ray": -1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You looked for better money. Ray started asking questions."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": true,
"gives": [
"unemployed",
"receipt_job_walkout",
"rent_140_due"
],
"say": "You quit to spite Ray. Rent stayed a hundred forty."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"ray": -2,
"darlene": -2,
"shorty": -2
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You called Ray a greedy bastard. He smiled and opened his notebook."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1,
"ray": -1
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You walked past Ray. He taped the bill to your door."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You spent twenty bucks in protest. Ray still wants his cut."
}
},
"expire": {
"h": 15,
"s": 20,
"c": 0,
"n": -8,
"trust": {
"ray": -2
},
"say": "Ray posted your balance on the door. Everybody can read it."
}
},
{
"id": "saturday_shift",
"ch": 2,
"title": "SATURDAY AIN'T FREE",
"who": "darlene",
"setup": "Darlene offers you a Saturday shift for an extra hundred bucks. Problem is, Pops invited you to a recovery cookout, and Mom said she'd love to see you there. The money's real. So are the people waiting for you.",
"now": 6,
"daily": 5,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You hit a meeting. Saturday's decision is still waiting."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 2,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "Pops said nobody can make this choice but you."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": true,
"gives": [
"cookout_attended",
"family_connection"
],
"say": "You helped set up the cookout. Mom saved you a plate."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept all afternoon. Missed the money and the burgers."
},
"work": {
"h": 6,
"s": 12,
"c": 100,
"n": -2,
"trust": {
"darlene": 2,
"ray": 1,
"pops": -1,
"mom": -1
},
"end": true,
"gives": [
"saturday_bonus",
"raise_progress"
],
"say": "You worked Saturday. Darlene smiled. Mom ate without you."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased another job. Saturday kept getting closer."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": true,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit instead of choosing. Now every Saturday's free."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"darlene": -2,
"ray": -2,
"shorty": -2
},
"end": true,
"gives": [
"saturday_offer_lost",
"receipt_parking_lot"
],
"say": "You told Darlene weekends are bullshit. She found another worker."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1,
"darlene": -1
},
"end": false,
"gives": [
"receipt_mom_stopped"
],
"say": "You ignored both invitations. Nobody saved you a seat."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"saturday_offer_lost",
"receipt_ghost_message"
],
"say": "You blew twenty bucks doing nothing. Everybody else had plans."
}
},
"expire": {
"h": 10,
"s": 15,
"c": 0,
"n": -8,
"trust": {
"darlene": -1,
"mom": -1,
"pops": -1
},
"say": "Saturday came and went. The shift got filled. The cookout ended."
}
},
{
"id": "pops_step_work",
"ch": 3,
"title": "POPS WANTS THE TRUTH",
"who": "pops",
"setup": "Pops hands you a notebook and says it's time to stop talking about doing the work and actually do it. He wants the ugly stuff too, not just the stories that make you look good. You've spent years running from your own head, and now this old bastard wants you to sit down and write about it.",
"now": 8,
"daily": 5,
"days": 4,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 2,
"ghost": -1
},
"end": false,
"gives": [
"step_work_started"
],
"say": "You showed up with the notebook. Pops asked when you're gonna open it."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 2,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"step_work_started",
"sponsor_active"
],
"say": "You told Pops the truth. He didn't flinch at the ugly parts."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": false,
"gives": [],
"say": "You helped somebody else. Your own notebook stayed empty."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept great. Your past was still waiting on the nightstand."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1
},
"end": false,
"gives": [],
"say": "You worked overtime in your head. Didn't write a damn word."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased a better paycheck. Pops still wants those pages."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1,
"pops": -1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit your job. Turns out unemployment doesn't write your inventory."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"shorty": -2
},
"end": false,
"gives": [
"receipt_pops_argument"
],
"say": "You told Pops he's not your therapist. He said, \"No shit.\""
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -2,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_nobody_answers"
],
"say": "You ignored Pops. That notebook got real comfortable collecting dust."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You threw the notebook across the room. The memories stayed."
}
},
"expire": {
"h": 12,
"s": 20,
"c": 0,
"n": -10,
"trust": {
"pops": -2
},
"say": "Pops stopped asking. Somehow that hurt worse than him pushing."
}
},
{
"id": "buy_the_car",
"ch": 3,
"title": "FOUR WHEELS AND A PRAYER",
"who": "shorty",
"setup": "Shorty found a used Honda for four hundred bucks. The paint's peeling, the radio only plays one station, and the seller says the engine is \"mostly solid.\" You've been saving for weeks, and those keys look like freedom with a check-engine light. Call your people and they will help you buy it right, once you have $400.",
"now": 5,
"daily": 4,
"days": 5,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You went to a meeting. Somebody else might buy that Honda."
},
"call": {
"h": -10,
"s": -10,
"c": -400,
"n": 7,
"trust": {
"pops": 1,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"car"
],
"say": "Pops' mechanic looked it over. You paid cash. The keys are yours."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": false,
"gives": [
"car_inspection_help"
],
"say": "You helped Shorty change a tire. At least one of you knows where the jack goes."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept on the decision. The Honda didn't get any prettier."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1
},
"end": false,
"gives": [
"car_savings_progress"
],
"say": "Another eighty toward the car. Your feet are ready to retire."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased better money. The seller wants cash today."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit the job paying for the car. Brilliant financial planning."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2,
"darlene": -2
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You accused Shorty of finding junk. He reminded you you're still riding the bus."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You ignored the seller. Somebody else came to look at it."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You burned twenty bucks. The Honda's still four hundred."
}
},
"expire": {
"h": 10,
"s": 15,
"c": 0,
"n": -5,
"trust": {
"shorty": -1
},
"say": "Somebody else bought the Honda. You're back at the bus stop."
}
},
{
"id": "shorty_slipping",
"ch": 3,
"title": "SHORTY AIN'T RIGHT",
"who": "shorty",
"setup": "Shorty's been missing meetings, sleeping all day, and snapping at everybody. You find him sitting behind the house staring at his phone, and he won't tell you who he's texting. You know that look because you've worn it yourself.",
"now": 12,
"daily": 8,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1,
"shorty": 1
},
"end": false,
"gives": [
"shorty_invited"
],
"say": "You saved Shorty a chair. He didn't show, but you kept it open."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 2,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"shorty_support_arranged"
],
"say": "You called Pops. He showed up without asking a hundred questions."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": true,
"gives": [
"shorty_supported",
"shorty_friend"
],
"say": "You sat beside Shorty until he finally put the phone down."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You got some sleep. Shorty was still outside when you woke up."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1,
"shorty": -1
},
"end": false,
"gives": [],
"say": "You went to work. Shorty didn't come out of his room."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1,
"shorty": -1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased a job lead. Shorty kept staring at that phone."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1,
"shorty": 1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit to keep an eye on Shorty. Now both of you need help."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2,
"darlene": -2
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You called Shorty a walking relapse. He told you to get lost."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_nobody_answers"
],
"say": "You shut your door. Shorty stopped knocking."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"receipt_ghost_message"
],
"say": "You gave up on Shorty. That look in his eyes didn't leave."
}
},
"expire": {
"h": 18,
"s": 22,
"c": 0,
"n": -12,
"trust": {
"shorty": -2,
"pops": -1
},
"say": "Shorty disappeared overnight. His bed was empty at breakfast."
}
},
{
"id": "moms_sunday",
"ch": 3,
"title": "SUNDAY AT MOM'S",
"who": "mom",
"setup": "Mom wants you at Sunday dinner. Your family hasn't seen you sober in a long time, and she's already told everybody you're coming. You've got a car almost paid for, a job that needs you, and a stomach full of nerves about sitting at that table.",
"now": 6,
"daily": 5,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You shared about family. Sunday dinner's still coming."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 2,
"shorty": 1,
"ghost": -1
},
"end": true,
"gives": [
"family_dinner_confirmed"
],
"say": "You told Mom you'd be there. She started crying over the potatoes."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 2
},
"end": true,
"gives": [
"family_dinner_attended",
"family_trust"
],
"say": "You showed up early and helped Mom cook. Nobody checked your pockets."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You took a nap. Mom kept your plate warm."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1,
"mom": -1
},
"end": false,
"gives": [],
"say": "You took the shift. Mom saved you leftovers and a little disappointment."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased a better job. Mom still wants you at the table."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit to free up Sunday. Mom asked how you'll pay rent."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"mom": -2,
"ray": -2,
"darlene": -2,
"shorty": -2
},
"end": true,
"gives": [
"family_dinner_lost",
"receipt_family_argument"
],
"say": "You told Mom to stop pressuring you. She said dinner was optional."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -2,
"pops": -1,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"receipt_mom_stopped"
],
"say": "You ignored her calls. She kept setting your place anyway."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": true,
"gives": [
"family_dinner_lost",
"receipt_ghost_message"
],
"say": "You blew off dinner. Mom put your plate in the fridge."
}
},
"expire": {
"h": 12,
"s": 18,
"c": 0,
"n": -10,
"trust": {
"mom": -2
},
"say": "Sunday passed. Mom stopped asking when you're coming over."
}
},
{
"id": "car_trouble",
"ch": 3,
"title": "THAT NOISE AIN'T GOOD",
"who": "shorty",
"setup": "The Honda starts making a grinding noise every time you turn left. Shorty says it's probably nothing, which is exactly what somebody says before a wheel falls off. The mechanic wants a hundred and twenty bucks just to make it stop screaming.",
"now": 10,
"daily": 7,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [],
"say": "You prayed for patience. The Honda prayed for a transmission."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [
"mechanic_referral"
],
"say": "Pops knows a mechanic who won't rob you blind."
},
"help": {
"h": -8,
"s": -5,
"c": -120,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1
},
"end": true,
"gives": [
"car_repaired"
],
"say": "You helped with the repair and paid the bill. The Honda finally shut up."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You stayed home. The car didn't heal itself."
},
"work": {
"h": 6,
"s": 12,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1
},
"end": false,
"gives": [
"repair_savings"
],
"say": "You worked another shift. The car screamed the whole way home."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You looked for better pay. The mechanic still wants his money."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit your job. The Honda didn't offer to pay rent."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -2,
"darlene": -2
},
"end": false,
"gives": [
"receipt_shorty_heard"
],
"say": "You blamed Shorty for the car. He reminded you who bought it."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"car_damage_warning"
],
"say": "You turned the radio up. The grinding got louder."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"car_damage_warning",
"receipt_ghost_message"
],
"say": "You drove it anyway and blew twenty bucks. Something underneath snapped."
}
},
"expire": {
"h": 20,
"s": 25,
"c": 0,
"n": -10,
"trust": {
"shorty": -1
},
"say": "The Honda died on the highway. You're riding the bus again."
}
},
{
"id": "new_kid",
"ch": 3,
"title": "THE NEW ONE",
"who": "ray",
"setup": "Big Ray brings in a new resident with one trash bag and the thousand-yard stare. They sit on the bottom bunk staring at the floor, looking exactly how you looked when you first got here. Shorty whispers, \"That one's gonna be trouble.\" You remember somebody saying that about you.",
"now": 5,
"daily": 4,
"days": 4,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1,
"ghost": -1
},
"end": false,
"gives": [
"newcomer_invited"
],
"say": "You saved the newcomer a seat. They sat in the back."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"mom": 1,
"shorty": 1,
"ghost": -1
},
"end": false,
"gives": [
"newcomer_support_advice"
],
"say": "Pops said remember how scared you were on day one."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"shorty": 2,
"pops": 1,
"mom": 1,
"ray": 1
},
"end": true,
"gives": [
"newcomer_friend",
"newcomer_supported"
],
"say": "You helped unpack the trash bag. They finally looked you in the eye."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept through their first day. Nobody showed them the ropes."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"ray": 1
},
"end": false,
"gives": [],
"say": "You went to work. The newcomer ate dinner alone."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"darlene": -1,
"mom": 1
},
"end": false,
"gives": [
"job_search_point"
],
"say": "You chased a better job. The new one still doesn't know your name."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -4,
"ray": -1,
"mom": -1
},
"end": false,
"gives": [
"unemployed",
"receipt_job_walkout"
],
"say": "You quit to stay around the house. Nobody asked you to do that."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"ray": -2,
"shorty": -2,
"darlene": -2
},
"end": false,
"gives": [
"receipt_ray_black_book"
],
"say": "You told Ray he treats people like inmates. The newcomer heard everything."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"pops": -1,
"mom": -2,
"shorty": -2,
"ghost": 1
},
"end": false,
"gives": [
"newcomer_isolated"
],
"say": "You walked past their bunk. They went back to staring at the floor."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"pops": -2,
"ray": -2,
"darlene": -2,
"mom": -2,
"shorty": -1,
"ghost": 2
},
"end": false,
"gives": [
"newcomer_isolated",
"receipt_ghost_message"
],
"say": "You told the newcomer to figure it out. Somebody once told you that too."
}
},
"expire": {
"h": 10,
"s": 15,
"c": 0,
"n": -8,
"trust": {
"ray": -1,
"pops": -1
},
"say": "The newcomer packed their trash bag and left. Nobody knew where they went."
}
}
];
if (typeof module !== "undefined") module.exports = { SITUATIONS };
