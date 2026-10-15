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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1
},
"end": false,
"gives": [
"old_crew_contact"
],
"say": "You spend your last fifteen bucks riding around with the old crew, laughing at stories that almost killed you."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about getting dinner and end up talking about everything except food."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost who's got food, and he offers you a different kind of delivery."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk the old block hungry and somehow find five dollars worth of trouble."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"love": -2
},
"end": true,
"gives": [
"fridge_money_blown"
],
"say": "You put your grocery money on the bar and come home with an empty wallet and an empty stomach."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1
},
"end": false,
"gives": [
"party_contact"
],
"say": "You hit a house party for free food and stay long after the pizza's gone."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"old_crew_contact"
],
"say": "You invite the old crew to laugh about Big Ray's inspection and give him three more reasons to inspect."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"ray": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex pictures of the stain and get twenty minutes of sympathy instead of a solution."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost how to get fifty bucks fast, and he says you already know."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"ray": -1
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You storm down the old block talking trash about Ray while the fifty-dollar fee sits on your bed."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"ray": -3
},
"end": false,
"gives": [
"bar_visit"
],
"say": "You spend twenty-five dollars complaining to strangers about a fifty-dollar stain."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"party_contact"
],
"say": "You ditch the inspection for a party and give Ray an empty room to write up."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"mom": -3
},
"end": false,
"gives": [
"mom_ignored"
],
"say": "You silence Mom's calls and let the old crew tell you how grown you are."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex instead of calling Mom because old drama asks fewer questions."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"mom": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You tell Ghost your mom keeps calling, and he reminds you how easy it is to disappear."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"mom": -2,
"ghost": 1
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk the old block with your phone on silent and pretend nobody's worried."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"mom": -3,
"love": -1
},
"end": false,
"gives": [
"bar_visit"
],
"say": "You sit at the bar ignoring Mom while your phone lights up beside the napkins."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"mom": -2
},
"end": false,
"gives": [
"party_contact"
],
"say": "You bury three missed calls under loud music and people who don't know your last name."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 2,
"pops": -2,
"ray": -1
},
"end": true,
"gives": [
"ghost_reconnected"
],
"say": "You climb into the crew's car with Ghost and leave the sober house gate behind you."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"ghost": 1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about Ghost outside and get talked into remembering the old days."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 4,
"pops": -3,
"ray": -2
},
"end": true,
"gives": [
"ghost_gate_contact"
],
"say": "You walk across the street and get into Ghost's car before your better judgment catches up."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 2,
"ray": -1
},
"end": true,
"gives": [
"ghost_followed"
],
"say": "You take the long way around the block and still end up standing beside Ghost's window."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"ghost": 1,
"love": -2
},
"end": false,
"gives": [
"bar_visit"
],
"say": "You duck into the bar to avoid Ghost and find three people who know him."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -2,
"ghost": 2
},
"end": true,
"gives": [
"ghost_party"
],
"say": "You accept Ghost's party invitation and stop pretending you were just going for a ride."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"shorty": -2,
"ray": -1
},
"end": false,
"gives": [
"old_crew_contact"
],
"say": "You turn Shorty's missing underwear into a group-chat joke and let him deal with Ray alone."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"shorty": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about the underwear investigation and forget Shorty still needs help."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"shorty": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost if he remembers sober house laundry drama and end up discussing worse things."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"shorty": -2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You leave Shorty arguing with the dryer and walk the block until the laundry room closes."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"shorty": -3,
"ray": -2
},
"end": false,
"gives": [
"bar_visit"
],
"say": "You spend twenty-five bucks telling a bartender about another grown adult's missing underwear."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"party_contact"
],
"say": "You drag Shorty to a party and leave the laundry mess waiting for Ray."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"darlene": -2
},
"end": false,
"gives": [
"interview_unprepared"
],
"say": "You spend interview night with the old crew and forget to set an alarm."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"darlene": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex until two in the morning and call it preparing for tomorrow."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"darlene": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You tell Ghost about the warehouse interview and listen while he offers easier money."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"darlene": -1
},
"end": false,
"gives": [
"interview_unprepared"
],
"say": "You walk the old block rehearsing excuses instead of interview answers."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"darlene": -4
},
"end": true,
"gives": [
"interview_missed"
],
"say": "You stay at the bar past closing and sleep through Darlene's interview."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"darlene": -3
},
"end": false,
"gives": [
"interview_unprepared"
],
"say": "You party until your interview clothes smell like somebody else's couch."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"darlene": -2
},
"end": false,
"gives": [
"work_unreliable"
],
"say": "You brag about extra hours to the old crew and start thinking you deserve a day off."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"darlene": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You tell your ex about the extra money and get asked why you never had any before."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"darlene": -3
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You tell Ghost your paycheck's getting bigger and watch him suddenly become interested."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"darlene": -2
},
"end": false,
"gives": [
"work_unreliable"
],
"say": "You spend the afternoon on the block instead of checking the extra-hours schedule."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"darlene": -2,
"love": -1
},
"end": false,
"gives": [
"bar_visit"
],
"say": "You celebrate money you haven't earned yet and put twenty-five dollars on a tab."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"darlene": -3
},
"end": true,
"gives": [
"extra_hours_lost"
],
"say": "You party through the first extra shift and Darlene gives those hours to somebody else."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 2,
"pops": -1,
"love": -1
},
"end": false,
"gives": [
"payday_crew"
],
"say": "You buy the old crew food and suddenly everybody remembers your number."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"love": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You tell your ex you got paid and immediately regret mentioning a dollar amount."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 3,
"pops": -2
},
"end": false,
"gives": [
"ghost_payday"
],
"say": "You tell Ghost your check cleared and he says he's got something worth celebrating."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You flash your paycheck money on the old block and attract every broke friend you ever had."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"love": -3
},
"end": true,
"gives": [
"payday_blown"
],
"say": "You turn payday into a bar tab and walk out wondering where your rent went."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"love": -2
},
"end": true,
"gives": [
"payday_party"
],
"say": "You throw twenty bucks into a party fund and spend the night surrounded by people who love payday."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"shorty": -3
},
"end": false,
"gives": [
"shorty_abandoned"
],
"say": "You spend fifteen bucks with the crew while Shorty counts the forty dollars he doesn't have."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"shorty": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You ask your ex what to do about Shorty and get a lecture you didn't order."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"shorty": -3
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost about a quick forty and learn the favor costs more than the money."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"shorty": -2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk the block avoiding Shorty's texts while Ray keeps asking where the rent is."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"shorty": -4
},
"end": true,
"gives": [
"shorty_refused"
],
"say": "You spend twenty-five bucks at the bar and tell Shorty you can't spare a dime."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": -2,
"pops": -1
},
"end": false,
"gives": [
"shorty_abandoned"
],
"say": "You invite Shorty to forget his rent at a party, but Ray won't forget a cent."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 2,
"pops": -1,
"darlene": -3
},
"end": false,
"gives": [
"warehouse_suspicion"
],
"say": "You wave the old crew over to Ghost's car while Darlene watches from the loading dock."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"darlene": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about Ghost outside and let the warehouse clock keep running."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 4,
"pops": -3,
"darlene": -5
},
"end": true,
"gives": [
"warehouse_ghost_contact"
],
"say": "You walk straight to Ghost's window and let Darlene see exactly who you're meeting."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 2,
"darlene": -3
},
"end": false,
"gives": [
"warehouse_suspicion"
],
"say": "You leave work through the back lot and circle around to Ghost on the block."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"darlene": -4,
"love": -2
},
"end": true,
"gives": [
"warehouse_walkout"
],
"say": "You leave your shift early for the bar and Darlene marks you absent."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"darlene": -4
},
"end": false,
"gives": [
"work_unreliable"
],
"say": "You tell Darlene you feel sick and spend the evening at a party instead."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"rent_resentment"
],
"say": "You complain about Ray's rent hike to the crew and get fifteen dollars poorer."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"ray": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about Ray's greed and hear how much better things used to be."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost how to make up the rent difference and he offers his usual shortcuts."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"ray": -2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk the block telling anybody who listens that Ray runs a damn robbery."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"ray": -3
},
"end": false,
"gives": [
"rent_money_spent"
],
"say": "You spend twenty-five dollars protesting a rent increase to a bartender who charges by the glass."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"ray": -2
},
"end": false,
"gives": [
"rent_money_spent"
],
"say": "You throw twenty dollars at a party and come home to Ray's new rent notice."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -2,
"mom": -2,
"darlene": -2
},
"end": false,
"gives": [
"saturday_crew"
],
"say": "You blow off the cookout for the old crew and forget Darlene still expects you at work."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -2,
"pops": -1,
"love": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about Saturday plans and let Mom's dinner invitation sit unanswered."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -2,
"darlene": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost what he's doing Saturday and get offered a third option worse than the first two."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"pops": -2,
"mom": -2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You wander the old block while Pops grills burgers and Mom keeps checking her phone."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -3,
"mom": -3,
"darlene": -4,
"love": -2
},
"end": true,
"gives": [
"saturday_shift_missed"
],
"say": "You skip work and Pops' cookout for a barstool that doesn't pay overtime or serve Mom's potato salad."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -3,
"mom": -2,
"darlene": -3
},
"end": true,
"gives": [
"saturday_party"
],
"say": "You spend Saturday at a stranger's party while Darlene loses a worker and Pops saves you a cold burger."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -3
},
"end": false,
"gives": [
"step_work_avoided"
],
"say": "You show the crew your empty notebook and get laughs from people who never wanted you to change."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"pops": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about the past instead of writing it down and end up arguing over whose memory is worse."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -3
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You tell Ghost Pops wants you writing about your mistakes and Ghost reminds you how to make new ones."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"pops": -2
},
"end": false,
"gives": [
"step_work_avoided"
],
"say": "You walk the old block looking at places that belong in the notebook without writing a damn word."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -4,
"love": -2
},
"end": true,
"gives": [
"step_work_abandoned"
],
"say": "You leave Pops' notebook on the dresser and head for the bar because nobody there asks you to be honest."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -3
},
"end": false,
"gives": [
"step_work_avoided"
],
"say": "You take the notebook to a party as a joke and come home with a stain on the cover."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"shorty": -1
},
"end": false,
"gives": [
"car_fund_dented"
],
"say": "You spend fifteen bucks showing off the four hundred you saved while Shorty's Honda sits waiting for a buyer."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"love": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You tell your ex you're buying a car and get asked for a ride before you even own the damn thing."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -2,
"shorty": -1
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You tell Ghost about the Honda and he starts talking about all the places you could drive together."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"shorty": -1
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk the old block bragging about wheels you haven't bought while somebody else calls Shorty about the Honda."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"shorty": -3,
"love": -2
},
"end": true,
"gives": [
"car_deal_lost"
],
"say": "You spend the night celebrating your future car at the bar and wake up to Shorty's text saying the Honda sold."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": -2,
"pops": -1,
"love": -1
},
"end": false,
"gives": [
"car_fund_dented"
],
"say": "You blow twenty bucks at a party telling everybody about your new ride while the keys still belong to somebody else."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -2,
"shorty": -3
},
"end": false,
"gives": [
"shorty_warning_ignored"
],
"say": "You tell the old crew Shorty's acting weird and laugh along when they call him a lost cause."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"shorty": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about Shorty's secret messages and get dragged into your own unfinished mess."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 3,
"pops": -3,
"shorty": -4
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost if he's heard from Shorty and get a long silence followed by a change of subject."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 2,
"shorty": -3
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk the old block looking for Shorty's mystery contact and end up seeing faces you worked hard to forget."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -3,
"shorty": -5,
"love": -2
},
"end": true,
"gives": [
"shorty_left_alone"
],
"say": "You leave Shorty staring at his phone and head to the bar, telling yourself his problems aren't yours."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": -4,
"pops": -2
},
"end": true,
"gives": [
"shorty_party_risk"
],
"say": "You invite Shorty to a party to cheer him up and watch him disappear into the crowd with somebody he won't introduce."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"mom": -4
},
"end": false,
"gives": [
"mom_dinner_missed"
],
"say": "You ride around with the crew while Mom keeps dinner warm and tells everybody you're probably running late."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -3,
"love": -2
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about Sunday dinner and end up remembering every holiday that went sideways."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -1,
"mom": -4
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You answer Ghost's message instead of Mom's and spend Sunday listening to promises you've heard before."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"mom": -3
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "You walk past the old hangouts while Mom's roast dries out under the kitchen light."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"mom": -5,
"love": -2
},
"end": true,
"gives": [
"mom_sunday_ruined"
],
"say": "You spend Sunday at the bar and send Mom a two-word excuse while she puts your untouched plate away."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"mom": -4
},
"end": true,
"gives": [
"mom_dinner_missed"
],
"say": "You choose a loud house party over Mom's dinner and come home hungry enough to remember what you missed."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -1,
"shorty": -1
},
"end": false,
"gives": [
"car_repair_delayed"
],
"say": "You ride with the crew complaining about your grinding Honda while the mechanic's quote sits in your pocket."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"love": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about the broken Honda and get reminded of every car you ever destroyed."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -2
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You ask Ghost for a cheap mechanic and he gives you a number that comes with a favor attached."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1
},
"end": false,
"gives": [
"car_repair_delayed"
],
"say": "You drive the grinding Honda around the old block looking for a backyard mechanic and make the noise twice as bad."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -2,
"love": -2
},
"end": false,
"gives": [
"repair_money_spent"
],
"say": "You spend twenty-five dollars whining about a hundred-twenty-dollar repair while the Honda sits crooked outside the bar."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -1,
"love": -1
},
"end": false,
"gives": [
"car_repair_delayed"
],
"say": "You take the grinding Honda to a party and let three loud experts tell you the transmission sounds fine."
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
"setup": "Big Ray brings in a new resident named Dre with one trash bag and the thousand-yard stare. Dre sits on the bottom bunk staring at the floor, looking exactly how you looked when you first got here. Shorty whispers, \"That one's gonna be trouble.\" You remember somebody saying that about you.",
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
"say": "You saved Dre a seat. He sat in the back anyway."
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
"say": "You helped Dre unpack the trash bag. He finally looked you in the eye."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept through Dre's first day. Nobody showed him the ropes."
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
"say": "You walked past Dre's bunk. He went back to staring at the floor."
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
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"pops": -2,
"ray": -1
},
"end": false,
"gives": [
"newcomer_ignored"
],
"say": "You leave the new kid standing with one trash bag while the old crew picks you up outside."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -1,
"pops": -1
},
"end": false,
"gives": [
"ex_contact"
],
"say": "You text your ex about the scared newcomer and spend an hour talking about how bad you had it."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 2,
"pops": -3,
"ray": -1
},
"end": false,
"gives": [
"ghost_reconnected"
],
"say": "You tell Ghost a new kid just moved in and hear him ask questions that make your stomach turn."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"ghost": 1,
"pops": -2
},
"end": false,
"gives": [
"newcomer_ignored"
],
"say": "You walk the old block instead of showing the newcomer around and leave the kid to figure out Big Ray alone."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"pops": -3,
"ray": -2,
"love": -2
},
"end": true,
"gives": [
"newcomer_abandoned"
],
"say": "You head to the bar while the newcomer asks where the meetings are, and you pretend you didn't hear."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"shorty": 1,
"pops": -3,
"ray": -2
},
"end": true,
"gives": [
"newcomer_party_risk"
],
"say": "You invite the newcomer to a party on the first night and call it making friends while every warning sign lights up."
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
"say": "Dre packed his trash bag and left. Nobody knows where he went."
}
},
{
"id": "love_dingy_shoes",
"ch": 2,
"title": "SHE DON'T DATE SCRUBS",
"who": "love",
"setup": "Jaz caught you outside the corner store wearing the same busted shoes you showed up to the sober house in. She likes you, but she's wondering if you put any effort into anything besides surviving. She's giving you a shot to prove otherwise.",
"now": 4,
"daily": 3,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"love": 1,
"pops": 2
},
"end": false,
"gives": [],
"say": "Hit a meeting before I start buying shit to impress somebody."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"love": 1,
"pops": 2
},
"end": false,
"gives": [],
"say": "Call Pops and ask if clean shoes count as character development."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"love": 2,
"pops": 2
},
"end": false,
"gives": [],
"say": "Help Shorty move his busted dresser instead of staring at my own shoes."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "Wash these nasty sneakers and hope the soles don't fall off."
},
"work": {
"h": 0,
"s": 10,
"c": 72,
"n": -2,
"trust": {
"love": 2,
"darlene": 1
},
"end": false,
"gives": [
"love_work_ethic"
],
"say": "Clock in and make enough money to quit dressing like a crime scene."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"love": 2,
"darlene": -1
},
"end": false,
"gives": [
"love_ambition"
],
"say": "Apply somewhere that pays enough for shoes AND rent."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"love": -5,
"darlene": -5
},
"end": true,
"gives": [
"love_red_flag"
],
"say": "Quit my job and tell Jaz I'm focusing on myself."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"love": -6
},
"end": true,
"gives": [
"love_shoe_fight"
],
"say": "Tell Jaz she can buy me shoes if she's that worried."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"love": -5
},
"end": true,
"gives": [
"love_ghosted"
],
"say": "Leave Jaz on read because my pride costs more than sneakers."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"love": -8,
"pops": -2
},
"end": true,
"gives": [
"love_red_flag"
],
"say": "Blow twenty bucks on junk and tell Jaz to kick rocks."
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"love": -5,
"ghost": 1
},
"end": true,
"gives": [
"love_old_crew"
],
"say": "Go hang with the old crew because they never cared about my shoes."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"love": -7
},
"end": true,
"gives": [
"love_ex_drama"
],
"say": "Text my ex because at least somebody used to like these shoes."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"love": -8,
"ghost": 5,
"pops": -3
},
"end": true,
"gives": [
"ghost_reconnected"
],
"say": "Hit up Ghost and forget why I was trying to look decent."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"love": -4,
"ghost": 2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "Walk the old block where these shoes got their mileage."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"love": -8,
"pops": -3
},
"end": true,
"gives": [
"love_bar_flag"
],
"say": "Spend my shoe money at the bar like a damn genius."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"love": -6,
"shorty": 1
},
"end": true,
"gives": [
"love_party_flag"
],
"say": "Show up at a party dressed like a broke rock star."
},
"look": {
"h": 0,
"s": -6,
"c": -60,
"n": 2,
"trust": {
"love": 8,
"mom": 1
},
"end": true,
"gives": [
"love_fresh_look"
],
"say": "Buy clean kicks, get a cut, and show Jaz I give a damn."
}
},
"expire": {
"h": 6,
"s": 10,
"c": 0,
"n": -3,
"trust": {
"love": -3
},
"say": "Three days later I'm still wearing the same beat-up shoes, and Jaz stopped asking when we're going out."
}
},
{
"id": "love_first_date",
"ch": 2,
"title": "TWENTY BUCKS, NO WHEELS",
"who": "love",
"setup": "Jaz finally said yes to a date. She wants to get out, grab something to eat, and have a real conversation. You got twenty dollars, no car, and Big Ray wants rent Friday.",
"now": 6,
"daily": 4,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"love": 1,
"pops": 2
},
"end": false,
"gives": [],
"say": "Hit a meeting and figure out how to date without acting desperate."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"love": 2,
"pops": 2
},
"end": false,
"gives": [
"love_honest_plan"
],
"say": "Call Pops and admit I got twenty bucks and big ideas."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"love": 2,
"shorty": 2
},
"end": false,
"gives": [],
"say": "Help Shorty fix his bike instead of begging him for a ride."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "Stay home and plan a cheap date that doesn't involve stealing flowers."
},
"work": {
"h": 0,
"s": 10,
"c": 72,
"n": -2,
"trust": {
"love": 4,
"darlene": 1
},
"end": true,
"gives": [
"love_date_fund"
],
"say": "Pick up a shift and earn enough to take Jaz somewhere decent."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"love": 2,
"darlene": -1
},
"end": false,
"gives": [
"love_ambition"
],
"say": "Apply for better work so twenty bucks stops being my whole personality."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"love": -7,
"darlene": -5
},
"end": true,
"gives": [
"love_red_flag"
],
"say": "Quit my job and tell Jaz we'll have more time together."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"love": -6
},
"end": true,
"gives": [
"love_date_fight"
],
"say": "Tell Jaz she must think she's some kind of princess."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"love": -7
},
"end": true,
"gives": [
"love_stood_up"
],
"say": "Don't answer Jaz because admitting I'm broke hurts worse."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"love": -9,
"ray": -2
},
"end": true,
"gives": [
"love_stood_up"
],
"say": "Blow my last twenty and pretend the date never existed."
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"love": -6,
"ghost": 1
},
"end": true,
"gives": [
"love_old_crew"
],
"say": "Go ride around with the old crew instead of showing up for Jaz."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"love": -8
},
"end": true,
"gives": [
"love_ex_drama"
],
"say": "Text my ex to see if I still got game."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"love": -10,
"ghost": 5,
"pops": -3
},
"end": true,
"gives": [
"ghost_reconnected"
],
"say": "Ask Ghost for a ride and invite a whole different kind of trouble."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"love": -5,
"ghost": 2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "Walk the old block looking for somebody who owes me money."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"love": -10,
"pops": -3
},
"end": true,
"gives": [
"love_bar_flag"
],
"say": "Spend date night at the bar without my actual date."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"love": -8,
"shorty": 1
},
"end": true,
"gives": [
"love_party_flag"
],
"say": "Hit a house party and tell myself that's basically a date."
},
"look": {
"h": 0,
"s": -6,
"c": -60,
"n": 2,
"trust": {
"love": 2,
"mom": 1
},
"end": false,
"gives": [
"love_fresh_look"
],
"say": "Buy fresh clothes and realize I can't afford to leave the house."
}
},
"expire": {
"h": 8,
"s": 12,
"c": 0,
"n": -5,
"trust": {
"love": -6
},
"say": "Jaz got dressed, waited for a plan, and went home when I never gave her one."
}
},
{
"id": "love_birthday_bar",
"ch": 2,
"title": "LOVE AIN'T WORTH A BARSTOOL",
"who": "love",
"setup": "Jaz wants you to come to her friend's birthday party at a bar Saturday night. She says nobody expects you to drink, but you know exactly what that place smells like and who might be there. She wants you beside her, not in trouble.",
"now": 8,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"love": 2,
"pops": 3
},
"end": false,
"gives": [
"love_boundary"
],
"say": "Hit a meeting and remember why I quit hanging around bars."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"love": 3,
"pops": 3
},
"end": true,
"gives": [
"love_boundary"
],
"say": "Call Pops and ask how to tell Jaz no without acting like a jerk."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"love": 2,
"pops": 2
},
"end": false,
"gives": [],
"say": "Help a newcomer get to a meeting instead of worrying about missing the party."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {
"love": 1
},
"end": false,
"gives": [],
"say": "Stay home, order food, and let Saturday night be somebody else's circus."
},
"work": {
"h": 0,
"s": 10,
"c": 72,
"n": -2,
"trust": {
"love": 1,
"darlene": 1
},
"end": false,
"gives": [
"love_work_ethic"
],
"say": "Take a Saturday shift and tell Jaz I can't make the bar."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 2,
"trust": {
"love": 1,
"darlene": -1
},
"end": false,
"gives": [
"love_ambition"
],
"say": "Spend Saturday chasing better work instead of a barstool."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"love": -5,
"darlene": -5
},
"end": true,
"gives": [
"love_red_flag"
],
"say": "Quit my job so I can party with Jaz whenever she wants."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"love": -6
},
"end": true,
"gives": [
"love_bar_fight"
],
"say": "Tell Jaz she's selfish for even asking me to go."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"love": -5
},
"end": true,
"gives": [
"love_ghosted"
],
"say": "Leave Jaz hanging because saying no takes a backbone."
},
"fkit": {
"h": 25,
"s": -25,
"c": -20,
"n": -15,
"trust": {
"love": -9,
"pops": -4
},
"end": true,
"gives": [
"love_bar_flag"
],
"say": "Say screw it and walk straight into the place I swore off."
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"love": -7,
"ghost": 2
},
"end": true,
"gives": [
"love_old_crew"
],
"say": "Hit up the old crew and turn one bad invitation into five."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"love": -8
},
"end": true,
"gives": [
"love_ex_drama"
],
"say": "Text my ex because apparently I need more drama tonight."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"love": -10,
"ghost": 5,
"pops": -4
},
"end": true,
"gives": [
"ghost_reconnected"
],
"say": "Text Ghost and let the wrong person decide my Saturday."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {
"love": -6,
"ghost": 2
},
"end": false,
"gives": [
"old_block_visit"
],
"say": "Walk the old block instead of facing the conversation with Jaz."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {
"love": -7,
"pops": -4,
"ghost": 2
},
"end": true,
"gives": [
"love_bar_flag"
],
"say": "Walk into that bar and pretend ginger ale makes me bulletproof."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {
"love": -5,
"pops": -3
},
"end": true,
"gives": [
"love_party_flag"
],
"say": "Skip the bar and crash a house party like that's somehow smarter."
},
"look": {
"h": 0,
"s": -6,
"c": -60,
"n": 2,
"trust": {
"love": 1
},
"end": false,
"gives": [
"love_fresh_look"
],
"say": "Buy a fresh outfit for a place I shouldn't be going."
}
},
"expire": {
"h": 10,
"s": 12,
"c": 0,
"n": -6,
"trust": {
"love": -4
},
"say": "Saturday came and went, and Jaz got tired of waiting for me to say what I actually wanted."
}
},
{
"id": "trip_moves_in",
"ch": 3,
"scale": "week",
"title": "THE NEW GUY",
"who": "house",
"setup": "Big Ray moved a guy named Trip into the room next to yours. Forty, prison tats, a laugh that never reaches his eyes. By Tuesday your charger is gone, Shorty’s shoes are gone, and Trip is wearing them. Everybody in the house is scared of him except Big Ray, and Big Ray hasn’t noticed yet.",
"now": 12,
"daily": 8,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {},
"end": false,
"gives": [],
"say": "You took it to a meeting instead of to Trip’s face. An old-timer said “you don’t have to attend every fight you’re invited to.” You didn’t. Yet."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1
},
"end": false,
"gives": [],
"say": "Pops: “Is he your business? No. Is he gonna be? Probably. Tell Ray. Tonight. In front of people.”"
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"ray": 2,
"shorty": 2
},
"end": true,
"gives": [
"trip_out"
],
"say": "You and Shorty walked into Ray’s office together. Ray listened, then went and opened Trip’s locker. Shorty’s shoes were in it. Trip’s out by Friday."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You bought a padlock. Trip watched you put it on and smiled. You slept with your wallet in your sock."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {},
"end": false,
"gives": [],
"say": "Six shifts. You were barely home. Trip was. So was your charger, until it wasn’t."
},
"double": {
"h": 8,
"s": 18,
"c": 0,
"n": -5,
"trust": {
"darlene": 1
},
"end": false,
"gives": [],
"say": "Twelve-hour days. You came home to sleep and left before Trip woke up. That’s not a plan. That’s hiding."
},
"argue": {
"h": 18,
"s": -10,
"c": 0,
"n": -4,
"trust": {
"shorty": 2,
"ray": 1
},
"end": true,
"gives": [
"trip_out"
],
"say": "You told Trip to give Shorty his shoes back. Trip laughed, took them off, and threw them at your chest. Ray came running. Trip’s gone. So is your jaw, for a day."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"shorty": -3
},
"end": true,
"gives": [],
"say": "You put your headphones in. Shorty walked around in socks for a week and stopped talking to you."
},
"fkit": {
"h": 30,
"s": -20,
"c": -20,
"n": -15,
"trust": {
"ray": -4,
"pops": -2,
"ghost": 2
},
"end": true,
"gives": [],
"say": "You caught Trip in the parking lot. Big Ray caught you. Both of you are out of the house tonight."
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ray": -2,
"ghost": 1
},
"end": false,
"gives": [],
"say": "The old crew came by and stood on the porch. Trip didn’t blink. Big Ray did. Now Ray thinks YOU brought the trouble."
},
"ghostlink": {
"h": 8,
"s": -18,
"c": 0,
"n": 3,
"trust": {
"ghost": 3,
"pops": -2
},
"end": true,
"gives": [
"trip_out",
"oldcontact"
],
"say": "Ghost said “say less.” Trip moved out two days later with a fat lip. Now you owe Ghost, and Ghost always collects."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {},
"end": false,
"gives": [],
"say": "You spent the week on the old block instead of the house. Trip helped himself to your room while you were gone."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {},
"end": false,
"gives": [],
"say": "You sat at the bar every night to avoid Trip. The bartender knows your soda order now. That’s a bad thing to be known for."
},
"party": {
"h": 5,
"s": -25,
"c": -20,
"n": 8,
"trust": {},
"end": false,
"gives": [],
"say": "Four nights out. You came home to a stripped room and a note that said “thanks.”"
}
},
"expire": {
"h": 10,
"s": 12,
"c": -40,
"n": -4,
"trust": {
"shorty": -1
},
"say": "You let it ride. Trip took forty bucks out of your jacket and dared you with his eyes to say something."
},
"need": [
"soberhouse",
"notrip"
],
"once": true,
"weight": 1,
"late": false
},
{
"id": "trip_knife",
"ch": 3,
"scale": "week",
"title": "TRIP PULLED A KNIFE",
"who": "shorty",
"setup": "Shorty’s whispering in the dark at 2 AM. Trip pulled a knife on him in the kitchen over the last of the milk. Then Trip told Shorty that if anybody says a word to Big Ray, the house is going to “have an accident.” Shorty wants to know what you’re going to do. Shorty is shaking.",
"now": 18,
"daily": 12,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 8,
"trust": {},
"end": false,
"gives": [],
"say": "You sat in a meeting while Shorty sat alone with a man who pulled a knife on him. The coffee was good. Your conscience wasn’t."
},
"call": {
"h": -5,
"s": -5,
"c": 0,
"n": 8,
"trust": {
"pops": 2,
"shorty": 3,
"ray": 1
},
"end": true,
"gives": [
"trip_out"
],
"say": "Pops picked up on the second ring. “Call Ray now. Then call the police. Then call me back.” You did all three. Trip was gone by noon."
},
"help": {
"h": -2,
"s": -6,
"c": 0,
"n": 10,
"trust": {
"shorty": 3,
"ray": 2
},
"end": true,
"gives": [
"trip_out"
],
"say": "You went with Shorty to Big Ray’s room at 2 AM. Ray came out in a robe with a baseball bat. Trip was on the porch with his trash bag by sunrise."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You slept on it. Trip didn’t. He was in your doorway at 5 AM, just looking."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {},
"end": false,
"gives": [],
"say": "You worked. Shorty didn’t sleep. Trip knows you know."
},
"argue": {
"h": 20,
"s": -8,
"c": 0,
"n": -2,
"trust": {
"shorty": 2,
"ray": -1
},
"end": true,
"gives": [
"trip_out"
],
"say": "You told Trip the knife was going to be a problem. He showed it to you. Big Ray walked in on the end of it. Trip’s out. Ray’s not thrilled with you either."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"shorty": -4,
"pops": -1
},
"end": true,
"gives": [],
"say": "“Just stay out of the kitchen.” Shorty looked at you like you were somebody else. Maybe you were."
},
"fkit": {
"h": 28,
"s": -15,
"c": -30,
"n": -10,
"trust": {
"ray": -5,
"pops": -2
},
"end": true,
"gives": [],
"say": "You went to the pawn shop. Big Ray found it in a bunk check. House rule: weapons, you’re out. Shelter tonight."
},
"crew": {
"h": 4,
"s": -20,
"c": -15,
"n": 6,
"trust": {
"ghost": 1,
"ray": -3,
"shorty": 1
},
"end": true,
"gives": [
"trip_out"
],
"say": "The crew rolled up deep. Trip saw them and left on his own. Big Ray saw them and wrote your name in the black book."
},
"ghostlink": {
"h": 12,
"s": -10,
"c": 0,
"n": 0,
"trust": {
"ghost": 3,
"pops": -3
},
"end": true,
"gives": [
"trip_out",
"oldcontact"
],
"say": "Ghost said Trip owes him from county anyway. Trip disappeared. Nobody asked where. You stopped sleeping anyway."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {},
"end": false,
"gives": [],
"say": "You sat at the bar with a Coke and thought about knives. The bartender asked if you were okay. You said yes. You lied."
}
},
"expire": {
"h": 15,
"s": 18,
"c": 0,
"n": -6,
"trust": {
"shorty": -3
},
"say": "You did nothing. Shorty moved to his cousin’s couch. Trip took Shorty’s bunk and your peace of mind."
},
"need": [
"soberhouse",
"trip"
],
"once": true,
"weight": 3,
"late": false
},
{
"id": "insurance_and_flat",
"ch": 3,
"scale": "week",
"title": "THE CAR HAS BILLS",
"who": "mechanic",
"setup": "The car you were so proud of has a flat, a check engine light, and an insurance bill that came the same day as rent. The mechanic says $180 for the tire and “don’t ask about the light.” Shorty needs a ride to court Thursday. Pops needs one to the doctor Friday. Everybody needs you now that you have wheels.",
"now": 8,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": -40,
"n": 10,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "You hit the meeting and asked the room. A guy named Sal fixes tires out of his garage. $40 and a story about 1987."
},
"call": {
"h": -10,
"s": -10,
"c": -90,
"n": 7,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "Pops: “Welcome to owning things. Things own you back.” He knows a guy. $90."
},
"help": {
"h": -8,
"s": 0,
"c": -180,
"n": 14,
"trust": {
"shorty": 2,
"pops": 2
},
"end": true,
"gives": [],
"say": "You drove Shorty to court on the spare and Pops to the doctor on a prayer. Fixed the tire Saturday. Felt like a person."
},
"rides": {
"h": -10,
"s": -4,
"c": -60,
"n": 12,
"trust": {
"shorty": 1,
"pops": 1
},
"end": true,
"gives": [],
"say": "You drove everybody and asked for gas money. Nobody minded. The tire got fixed off the tips."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You parked the car for a week. Shorty took the bus to court. Pops missed the doctor. The light’s still on."
},
"work": {
"h": 6,
"s": 10,
"c": -180,
"n": -4,
"trust": {},
"end": true,
"gives": [],
"say": "Six shifts, then the tire. You missed Thursday and Friday for Shorty and Pops. The car works. Nobody called it fixed."
},
"double": {
"h": 8,
"s": 18,
"c": -180,
"n": -6,
"trust": {
"darlene": 1,
"love": -1
},
"end": true,
"gives": [],
"say": "You pulled doubles to pay for the car you pulled doubles for. The light’s still on. So are you, barely."
},
"argue": {
"h": 15,
"s": -12,
"c": -180,
"n": -6,
"trust": {},
"end": false,
"gives": [],
"say": "You told the mechanic he was a crook. He agreed and charged you anyway."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"shorty": -2,
"pops": -1
},
"end": true,
"gives": [],
"say": "You turned the radio up and told everybody you were busy. The car ran fine for exactly one week."
},
"fkit": {
"h": 20,
"s": -20,
"c": 300,
"n": -8,
"trust": {
"ghost": 2,
"pops": -2
},
"end": true,
"gives": [
"car_sold"
],
"say": "Ghost gave you $300 for a car worth more. You walked home. You’re walking everywhere now."
},
"bar": {
"h": 6,
"s": -22,
"c": -25,
"n": 6,
"trust": {},
"end": false,
"gives": [],
"say": "You sat at the bar instead of under the car. The tire didn’t fix itself. The bartender didn’t charge you for the soda. He’s waiting."
},
"carfund": {
"h": 0,
"s": -5,
"c": -180,
"n": 0,
"trust": {},
"end": true,
"gives": [],
"say": "You emptied what was left in the car envelope. Tire fixed. The light stayed on. It always does."
}
},
"expire": {
"h": 8,
"s": 14,
"c": -120,
"n": -5,
"trust": {
"shorty": -1,
"pops": -1
},
"say": "You drove on the spare for a week until it blew on the highway. Tow truck: $120. Shorty missed court."
},
"need": [
"car"
],
"once": false,
"weight": 1,
"late": false
},
{
"id": "darlene_lead",
"ch": 3,
"scale": "week",
"title": "DARLENE’S CLIPBOARD",
"who": "darlene",
"setup": "Darlene calls you into the office. The lead on second shift walked out. She wants you to run the dock: $120 a shift, your own clipboard, and everybody’s problems. Catch: lead works the schedule Darlene posts, and Darlene posts meetings-night. “I need an answer by Friday. I need somebody who shows up.”",
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
"pops": 1
},
"end": false,
"gives": [],
"say": "You asked the meeting. Half said take it, half said don’t. Pops said “both halves are right.” Helpful."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 7,
"trust": {
"pops": 1,
"darlene": 2
},
"end": true,
"gives": [
"lead"
],
"say": "Pops: “Take the job. Find a morning meeting. The program don’t care what time it is.” You took it."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 14,
"trust": {
"darlene": 2,
"shorty": 1
},
"end": true,
"gives": [],
"say": "You found out Benny needs it more: custody case, lawyer bills. You told Darlene to give it to him. She looked at you different."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {
"darlene": 1
},
"end": true,
"gives": [
"lead"
],
"say": "You slept on it. Friday came. You said yes with your eyes half open."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 2
},
"end": true,
"gives": [
"lead"
],
"say": "$120 a shift. A radio on your hip. Six people who hate you by lunch. You’re lead."
},
"double": {
"h": 10,
"s": 22,
"c": 0,
"n": -6,
"trust": {
"darlene": 3,
"love": -2,
"mom": -1
},
"end": true,
"gives": [
"lead"
],
"say": "Lead on second, doubles on weekends. Darlene said “don’t burn out on me.” You said you don’t burn out. You have before."
},
"quit": {
"h": 8,
"s": -20,
"c": 0,
"n": -5,
"trust": {
"darlene": -5
},
"end": true,
"gives": [],
"say": "You quit instead of deciding. Freedom tasted like unemployment by Monday."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"darlene": -2,
"pops": 1
},
"end": true,
"gives": [],
"say": "You told her meetings come first. She said “then you’re not lead.” Benny is."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"darlene": -2
},
"end": true,
"gives": [],
"say": "You ducked the office all week. Friday she stopped asking."
},
"fkit": {
"h": 22,
"s": -20,
"c": 0,
"n": -10,
"trust": {
"darlene": -4,
"ray": -1
},
"end": true,
"gives": [],
"say": "Loud. In front of the dock. Benny is lead. You’re on the list."
},
"betterjob": {
"h": 5,
"s": 8,
"c": -10,
"n": 4,
"trust": {
"darlene": -3
},
"end": true,
"gives": [],
"say": "You told the temp agency you’d been offered lead. They had something better. Darlene heard."
},
"date": {
"h": 0,
"s": -8,
"c": -60,
"n": 6,
"trust": {
"love": 2,
"darlene": 1
},
"end": true,
"gives": [
"lead",
"love_touch"
],
"say": "Jaz: “you’re asking ME? take the money, baby.” You took the money."
}
},
"expire": {
"h": 6,
"s": 10,
"c": 0,
"n": -3,
"trust": {
"darlene": -2
},
"say": "You never answered. Darlene gave it to a guy named Benny who’s been there two months. He wears the clipboard like a badge."
},
"need": [
"job",
"nolead",
"nobiz"
],
"once": true,
"weight": 1,
"late": false
},
{
"id": "jaz_cookout",
"ch": 3,
"scale": "week",
"title": "MEET THE FAMILY",
"who": "love",
"setup": "Jaz’s mom is having the cookout. The whole family. Her uncle who “doesn’t believe in rehab,” her cousin who sells pills, and a cooler the size of a casket. Jaz wants you there. “They need to see you’re real.” It’s the same Saturday as the speaker meeting Pops asked you to drive him to.",
"now": 8,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 10,
"trust": {
"love": 2,
"pops": 2
},
"end": true,
"gives": [
"love_touch"
],
"say": "You brought Jaz to the speaker meeting instead. She cried at the end and squeezed your hand. “Okay. Now I get it.” Her mom is still mad."
},
"call": {
"h": -8,
"s": -6,
"c": 0,
"n": 8,
"trust": {
"love": 2,
"pops": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "Pops: “Go to the cookout. Drink the pop. Leave at the first ‘one won’t hurt.’ I’ll get a ride.” You lasted till 7."
},
"help": {
"h": -8,
"s": -5,
"c": -20,
"n": 12,
"trust": {
"love": 1,
"pops": 2
},
"end": true,
"gives": [
"love_touch"
],
"say": "You drove Pops, then showed up at dusk with a pie. Jaz’s mom said “at least he brought something.”"
},
"rides": {
"h": -10,
"s": -4,
"c": -15,
"n": 12,
"trust": {
"love": 1,
"pops": 2
},
"end": true,
"gives": [
"love_touch"
],
"say": "Pops to the meeting at noon, cookout by three, out by six. Everybody got a piece of you."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You said you were sick. Jaz said “of what?” You didn’t have an answer."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"darlene": 1,
"love": -2
},
"end": false,
"gives": [],
"say": "Darlene needed the hands. Jaz needed you. Darlene pays better. Jaz remembers longer."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"love": -3
},
"end": true,
"gives": [],
"say": "You said her family is a bad place for you. True. You said it like an accusation. Not true."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"love": -4
},
"end": true,
"gives": [],
"say": "Saturday came and went. Sunday you texted “my bad.” She left YOU on read."
},
"fkit": {
"h": 22,
"s": -25,
"c": 0,
"n": -5,
"trust": {
"love": -2,
"pops": -3,
"ghost": 1
},
"end": true,
"gives": [],
"say": "You went. You sat by the cooler. Her cousin offered. You said no the first three times."
},
"bar": {
"h": 8,
"s": -18,
"c": -30,
"n": 3,
"trust": {
"love": -2
},
"end": true,
"gives": [],
"say": "You skipped the cookout and met her at a bar after. She was already annoyed. The bar didn’t help."
},
"party": {
"h": 6,
"s": -20,
"c": -20,
"n": 4,
"trust": {
"love": -2
},
"end": true,
"gives": [],
"say": "You treated it like a party. Her uncle treated you like a punchline. Jaz drove you home early."
},
"look": {
"h": 0,
"s": -6,
"c": -80,
"n": 6,
"trust": {
"love": 3,
"mom": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "New fit, fresh cut, a store-bought pie. Her mom said “he clean up alright.” Jaz said “told you.”"
},
"date": {
"h": 0,
"s": -10,
"c": -70,
"n": 8,
"trust": {
"love": 3
},
"end": true,
"gives": [
"love_touch"
],
"say": "You went. Two hours. Then you took her to dinner, just you two. She said that was the best part."
}
},
"expire": {
"h": 8,
"s": 14,
"c": 0,
"n": -5,
"trust": {
"love": -3,
"pops": -1
},
"say": "You didn’t go to either. Jaz went alone and told her mom you had to work. Her mom said “mm-hm.”"
},
"need": [
"together"
],
"once": true,
"weight": 1,
"late": false
},
{
"id": "dre_first_meeting",
"ch": 3,
"scale": "week",
"title": "DRE’S FIRST MEETING",
"who": "newcomer",
"setup": "Dre, the new kid, has been at the house two weeks and hasn’t been to a meeting. Big Ray’s about to put him out for it. Dre asked you, not Shorty, not Pops, YOU, to take him. “You the only one here who don’t look at me like I already failed.” He’s scared of the room.",
"now": 6,
"daily": 5,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -10,
"c": 0,
"n": 14,
"trust": {
"pops": 2,
"shorty": 1,
"ray": 1
},
"end": true,
"gives": [
"dre_in"
],
"say": "You walked in together. Dre sat on his hands the whole hour and said “thanks” twice in the car. He went back Tuesday on his own."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 8,
"trust": {
"pops": 1
},
"end": true,
"gives": [
"dre_in"
],
"say": "Pops took him. Dre came back quiet. “Pops said you told him to. Thanks for not making it a thing.”"
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 14,
"trust": {
"pops": 2,
"shorty": 1
},
"end": true,
"gives": [
"dre_in"
],
"say": "You went early and saved two seats. He almost didn’t come in. Then he did."
},
"rides": {
"h": -10,
"s": -4,
"c": -15,
"n": 14,
"trust": {
"pops": 2,
"shorty": 1
},
"end": true,
"gives": [
"dre_in"
],
"say": "Five nights. Five meetings. By Friday Dre was talking to people in the parking lot."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You said next week. Big Ray said Sunday. Dre’s gone."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"ray": -1
},
"end": false,
"gives": [],
"say": "You worked. Nobody else did. Big Ray did what Big Ray does."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"ray": -1
},
"end": false,
"gives": [],
"say": "You told Big Ray to give the kid a minute. Ray said “minutes cost $100 a week.” He gave him one more week anyway."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"shorty": -2
},
"end": true,
"gives": [],
"say": "You said you had enough on your plate. Dre nodded like he expected it."
},
"fkit": {
"h": 20,
"s": -20,
"c": 0,
"n": -10,
"trust": {
"pops": -3,
"ghost": 2
},
"end": true,
"gives": [],
"say": "You told him the whole thing’s a scam and the house is a racket. He believed you. He was gone in three days, with Ghost."
},
"crew": {
"h": 10,
"s": -18,
"c": -15,
"n": 2,
"trust": {
"ghost": 2,
"pops": -2
},
"end": true,
"gives": [],
"say": "You showed Dre the old crew. He fit right in. That’s the worst part."
},
"block": {
"h": 8,
"s": -15,
"c": -5,
"n": 5,
"trust": {},
"end": false,
"gives": [],
"say": "You took Dre around the old block to “show him what not to do.” He got three phone numbers."
}
},
"expire": {
"h": 6,
"s": 8,
"c": 0,
"n": -6,
"trust": {
"pops": -1
},
"say": "You didn’t take him. Big Ray put Dre out Sunday. He left his trash bag on the porch. Nobody knows where he went."
},
"need": [],
"once": true,
"weight": 1,
"late": false
},
{
"id": "mom_amends",
"ch": 3,
"scale": "week",
"title": "THE AMENDS",
"who": "mom",
"setup": "Pops says it’s time. Mom. Not a sorry: a list. The money, the lies, the night with the police in her kitchen. She said she’d see you Sunday. She also said “don’t make a speech.” You’ve had thirty days to think about what you did. She’s had years.",
"now": 6,
"daily": 4,
"days": 3,
"moves": {
"meeting": {
"h": -12,
"s": -10,
"c": 0,
"n": 12,
"trust": {
"mom": 3,
"pops": 2
},
"end": true,
"gives": [],
"say": "You went to a meeting first and said it out loud to strangers. Then you said it to her. She didn’t say “it’s okay.” She said “thank you for saying it.”"
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 10,
"trust": {
"mom": 3,
"pops": 2
},
"end": true,
"gives": [],
"say": "You read it to Pops first. He crossed out half. “That’s you feeling better. This half is for her.” Sunday went better than it should have."
},
"help": {
"h": -8,
"s": -5,
"c": -30,
"n": 14,
"trust": {
"mom": 4
},
"end": true,
"gives": [],
"say": "You fixed the step she’s been asking about for three years, then sat down and told her. She listened with a hand on your back."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You wrote four pages. Threw out three. Sunday’s still coming."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"mom": -1,
"darlene": 1
},
"end": false,
"gives": [],
"say": "You picked up a shift. Mom said “of course.” It wasn’t mean. It was tired."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"mom": -3,
"pops": -2
},
"end": true,
"gives": [],
"say": "Halfway through, you brought up her stuff. The step work says you don’t. You did. She got up and did the dishes."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"mom": -1
},
"end": true,
"gives": [],
"say": "You sent a long text. She replied “ok.” Two letters."
},
"fkit": {
"h": 22,
"s": -20,
"c": -25,
"n": -8,
"trust": {
"mom": -3,
"pops": -2
},
"end": true,
"gives": [],
"say": "You didn’t go. You hit the bar after work “just for the game.” Mom heard. She always hears."
},
"ex": {
"h": 3,
"s": -15,
"c": 0,
"n": 4,
"trust": {
"mom": -2,
"love": -3
},
"end": true,
"gives": [],
"say": "You brought the ex for backup. Mom took one look and said “really?” Nobody ate."
},
"date": {
"h": -5,
"s": -8,
"c": -20,
"n": 10,
"trust": {
"mom": 3,
"love": 2
},
"end": true,
"gives": [
"love_touch"
],
"say": "You brought Jaz. Mom held her hand through the hard part and kept holding it after. “This one,” Mom said."
},
"look": {
"h": 0,
"s": -6,
"c": -60,
"n": 8,
"trust": {
"mom": 3
},
"end": true,
"gives": [],
"say": "New shirt, clean shoes, a haircut. She noticed before you said a word. Then you said the words."
}
},
"expire": {
"h": 6,
"s": 16,
"c": 0,
"n": -4,
"trust": {
"mom": -2,
"pops": -1
},
"say": "You kept putting Sunday off. Mom stopped asking if you were coming. That’s its own kind of answer."
},
"need": [],
"once": true,
"weight": 1,
"late": false
},
{
"id": "ghost_collects",
"ch": 3,
"scale": "week",
"title": "GHOST’S INVOICE",
"who": "ghost",
"setup": "Ghost texts a number: $400. “From back when. I let it ride ’cause you was sick. You got a job now.” You don’t remember owing it. You don’t remember a lot of back then. He’s parked outside the warehouse at quitting time, engine running, friendly as hell.",
"now": 16,
"daily": 12,
"days": 2,
"moves": {
"meeting": {
"h": -14,
"s": -8,
"c": 0,
"n": 10,
"trust": {
"pops": 2,
"ghost": -2
},
"end": true,
"gives": [],
"say": "You said it in the meeting: a dealer says I owe him. Three guys stayed after. “You don’t owe a dealer. You owe the people you robbed to pay him.”"
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 6,
"trust": {
"pops": 2,
"ray": 1,
"ghost": -3
},
"end": true,
"gives": [],
"say": "Pops: “You pay that, you’re buying. Block him. If he comes to the house, Ray handles it.” You blocked him. He came by once. Ray handled it."
},
"help": {
"h": -6,
"s": -5,
"c": 0,
"n": 8,
"trust": {
"darlene": 2,
"ghost": -1
},
"end": true,
"gives": [],
"say": "You told Darlene a guy was waiting on you. She walked you out the loading dock side for a week and never asked why."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You went straight home all week. Ghost texted a picture of the house. “Nice porch.”"
},
"work": {
"h": 8,
"s": -10,
"c": -400,
"n": -2,
"trust": {
"ghost": 3,
"pops": -2
},
"end": true,
"gives": [],
"say": "You handed Ghost $400 in the lot. He said “see, that wasn’t hard.” He’ll be back for the rest of what you don’t owe."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -6,
"trust": {
"ghost": 1
},
"end": false,
"gives": [],
"say": "You told him in the lot, loud. He laughed. “Okay. Okay. We’ll see.” He’s still parked there."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"ghost": -2
},
"end": true,
"gives": [],
"say": "You blocked the number. He got a new one. You blocked that. Three numbers in, he stopped. For now."
},
"fkit": {
"h": 35,
"s": -25,
"c": 100,
"n": -10,
"trust": {
"ghost": 4,
"pops": -3
},
"end": true,
"gives": [
"oldcontact"
],
"say": "He said you could work it off. One ride. One package. You didn’t open it. You know what was in it."
},
"crew": {
"h": 8,
"s": -15,
"c": -100,
"n": 4,
"trust": {
"ghost": 2
},
"end": true,
"gives": [],
"say": "The crew said yeah, you owed him, and some of them too. Now everybody’s got an invoice."
},
"ghostlink": {
"h": 14,
"s": -18,
"c": -150,
"n": 0,
"trust": {
"ghost": 3,
"pops": -2
},
"end": true,
"gives": [
"oldcontact"
],
"say": "You got in the car “to talk.” $150 and a favor you’ll hear about later."
},
"block": {
"h": 6,
"s": -10,
"c": -5,
"n": 5,
"trust": {
"ghost": -1
},
"end": true,
"gives": [],
"say": "The block said Ghost does this to everybody who gets clean. Tax on getting better."
}
},
"expire": {
"h": 18,
"s": 15,
"c": -200,
"n": -5,
"trust": {
"ghost": 2
},
"say": "You stalled. Ghost took $200 off you in the parking lot “as a down payment” and smiled the whole time."
},
"need": [],
"once": false,
"weight": 2,
"late": false
},
{
"id": "shorty_relapse",
"ch": 3,
"scale": "week",
"title": "SHORTY WENT OUT",
"who": "shorty",
"setup": "Shorty didn’t come home Tuesday. Wednesday either. His phone goes to voicemail. Thursday he texts you from a number you don’t know: “im ok dont tell ray.” You know the block he’s on. You know the house. You know exactly what’s in it.",
"now": 14,
"daily": 10,
"days": 2,
"moves": {
"meeting": {
"h": -10,
"s": -6,
"c": 0,
"n": 14,
"trust": {
"shorty": 3,
"pops": 2
},
"end": true,
"gives": [],
"say": "You said it in the meeting. Four guys went with you, in two cars, in daylight. Shorty came out on his own when he saw Pops."
},
"call": {
"h": -8,
"s": -8,
"c": 0,
"n": 12,
"trust": {
"shorty": 3,
"pops": 2,
"ray": 1
},
"end": true,
"gives": [],
"say": "Pops: “You don’t go in that house. You call Ray, you call me, we go together.” Three of you. Shorty cried in the back seat."
},
"help": {
"h": -5,
"s": -5,
"c": 0,
"n": 14,
"trust": {
"shorty": 4,
"pops": 2
},
"end": true,
"gives": [],
"say": "You went at noon with Pops in the passenger seat and the engine running. Two minutes. Shorty came out."
},
"rides": {
"h": -6,
"s": -2,
"c": -20,
"n": 12,
"trust": {
"shorty": 3
},
"end": true,
"gives": [],
"say": "You drove past every day and honked. Day three he got in. Day four he detoxed on your floor."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {
"shorty": -1
},
"end": false,
"gives": [],
"say": "You gave him space. The house gave him a locked door."
},
"work": {
"h": 6,
"s": 10,
"c": 0,
"n": 0,
"trust": {
"ray": 2,
"shorty": 1
},
"end": true,
"gives": [],
"say": "You told Big Ray straight. Ray went himself. Shorty’s back on probation with the house. He’s alive."
},
"argue": {
"h": 15,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"shorty": -2
},
"end": false,
"gives": [],
"say": "You yelled. He hung up. The new number stopped answering."
},
"ignore": {
"h": 12,
"s": -15,
"c": 0,
"n": -12,
"trust": {
"ray": -3,
"shorty": -1
},
"end": true,
"gives": [],
"say": "You kept his secret for a week. Ray found out anyway. Now you’re both in the black book."
},
"fkit": {
"h": 30,
"s": -20,
"c": -40,
"n": -5,
"trust": {
"shorty": 1,
"ghost": 2,
"pops": -2
},
"end": true,
"gives": [],
"say": "You went in alone at night. You found him. You also found the table. You sat down for a minute. Just a minute."
},
"ghostlink": {
"h": 14,
"s": -10,
"c": 0,
"n": 2,
"trust": {
"ghost": 2,
"shorty": 1
},
"end": true,
"gives": [
"oldcontact"
],
"say": "Ghost knew. Of course Ghost knew. “Tell Shorty his tab’s open.”"
},
"block": {
"h": 10,
"s": -10,
"c": -5,
"n": 6,
"trust": {
"shorty": 2
},
"end": true,
"gives": [],
"say": "You walked the block asking. Everybody knew where. Nobody wanted to say. Three days later he walked up to you on that same corner."
}
},
"expire": {
"h": 12,
"s": 18,
"c": 0,
"n": -8,
"trust": {
"shorty": -2,
"ray": -1
},
"say": "You waited. Big Ray found out Friday and boxed Shorty’s stuff. Shorty came home to a locked door."
},
"need": [],
"once": false,
"weight": 2,
"late": false
},
{
"id": "lights_notice",
"ch": 4,
"scale": "month",
"title": "THE PINK NOTICE",
"who": "landlord",
"setup": "Your own place. Your own door. Your own pink notice from the electric company. Rent took everything, the car took the rest, and the lights are $140 behind. The landlord texts: “FYI utilities are in your name. Not mine. Not my problem.” It is the first of the month and you have $60.",
"now": 6,
"daily": 5,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": -40,
"n": 10,
"trust": {},
"end": true,
"gives": [],
"say": "A woman at the meeting works at the county. There’s a program. Forms, a wait, and the lights stayed on."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 6,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "Pops gave you $140 and a lecture about budgets. “Pay me back $20 a week. In person.” You did."
},
"help": {
"h": -6,
"s": 0,
"c": 150,
"n": 10,
"trust": {},
"end": true,
"gives": [
"bizseed"
],
"say": "The old guy across the hall needed his yard cleared. $150 cash and a lead on two more."
},
"rest": {
"h": -5,
"s": -10,
"c": 0,
"n": 0,
"trust": {},
"end": true,
"gives": [],
"say": "You sat in the dark with a notebook and did math for the first time since school. It didn’t fix the bill. It fixed the next one."
},
"work": {
"h": 6,
"s": 10,
"c": -180,
"n": -2,
"trust": {},
"end": true,
"gives": [],
"say": "You worked. Paid on the 20th with the late fee. Lights stayed on. Barely."
},
"double": {
"h": 8,
"s": 18,
"c": -140,
"n": -6,
"trust": {
"darlene": 1,
"love": -2
},
"end": true,
"gives": [],
"say": "Two weeks of doubles. Paid in full on the 10th. You didn’t see daylight or Jaz."
},
"quit": {
"h": 10,
"s": -15,
"c": 0,
"n": -6,
"trust": {
"ray": 1,
"mom": -2
},
"end": true,
"gives": [
"moved_back"
],
"say": "You gave up the place and went back to the sober house. Big Ray didn’t even look surprised."
},
"argue": {
"h": 12,
"s": -8,
"c": 0,
"n": -2,
"trust": {},
"end": false,
"gives": [],
"say": "Forty minutes on hold, ten minutes yelling. They put a note in your file. The note was not helpful."
},
"ignore": {
"h": 10,
"s": -10,
"c": 0,
"n": -6,
"trust": {},
"end": true,
"gives": [],
"say": "You ignored it. Pink turned red. Red turned dark."
},
"fkit": {
"h": 18,
"s": -20,
"c": 60,
"n": -4,
"trust": {
"pops": -1
},
"end": true,
"gives": [],
"say": "Pawned the TV, paid the light bill, blew the rest at the bar celebrating lights."
},
"crew": {
"h": 8,
"s": -12,
"c": 140,
"n": 4,
"trust": {
"ghost": 1
},
"end": true,
"gives": [],
"say": "The crew fronted you $140 and a “we got you.” Now you’re in the crew’s book."
},
"ghostlink": {
"h": 14,
"s": -15,
"c": 140,
"n": 0,
"trust": {
"ghost": 3,
"pops": -2
},
"end": true,
"gives": [
"oldcontact"
],
"say": "Ghost paid your light bill directly. Online. From his phone. Now he has your account number."
},
"bizfund": {
"h": 0,
"s": -4,
"c": 200,
"n": 6,
"trust": {},
"end": true,
"gives": [
"bizseed"
],
"say": "You bought a used mower with the stack money and knocked on doors. Six yards. $200. The lights stayed on."
}
},
"expire": {
"h": 8,
"s": 18,
"c": 0,
"n": -4,
"trust": {},
"say": "The lights went off on the 14th. You charged your phone at the gas station for two weeks like it was day one."
},
"need": [
"ownplace"
],
"once": true,
"weight": 2,
"late": false
},
{
"id": "dre_asks",
"ch": 4,
"scale": "month",
"title": "DRE WANTS A SPONSOR",
"who": "newcomer",
"setup": "Dre has sixty days. He waited for you after the meeting, hands in his pockets, and asked you to sponsor him. You, with barely a hundred days. Pops is standing by the coffee pot pretending not to listen. Dre has a court date, a kid he’s not allowed to see, and a mother who stopped picking up. He needs somebody. He picked you.",
"now": 4,
"daily": 4,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -6,
"c": 0,
"n": 14,
"trust": {
"pops": 2,
"shorty": 1
},
"end": true,
"gives": [
"sponsee"
],
"say": "You said yes right there. Pops nodded once. Dre calls at 10 PM every night now. You pick up every time."
},
"call": {
"h": -10,
"s": -8,
"c": 0,
"n": 10,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"sponsee"
],
"say": "Pops: “Nobody’s ready. You got a phone and a year of mistakes. That’s the job.” You said yes."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"sponsee"
],
"say": "You told Dre you’d do it together with Pops. Three-way calls. Pops does the big book, you do the 2 AM."
},
"rest": {
"h": -5,
"s": -10,
"c": 0,
"n": 6,
"trust": {},
"end": true,
"gives": [
"sponsee"
],
"say": "You said give me a week. He gave you two. You said yes on a Tuesday in the rain."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"pops": -1
},
"end": false,
"gives": [],
"say": "You said you can’t right now. True. He said “it’s cool.” Not true."
},
"argue": {
"h": 4,
"s": -6,
"c": 0,
"n": -2,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "You pushed him to Pops. Pops took him. Pops also said “he asked YOU.”"
},
"ignore": {
"h": 10,
"s": -10,
"c": 0,
"n": -8,
"trust": {
"pops": -2,
"shorty": -1
},
"end": true,
"gives": [],
"say": "You dodged him at every meeting. He stopped coming to that one."
},
"fkit": {
"h": 15,
"s": -18,
"c": 0,
"n": -8,
"trust": {
"pops": -2,
"ghost": 1
},
"end": true,
"gives": [],
"say": "“I can’t even keep my own lights on.” Dre laughed. Then he went and found somebody else. Somebody worse."
},
"date": {
"h": 0,
"s": -8,
"c": -60,
"n": 8,
"trust": {
"love": 2,
"pops": 1
},
"end": true,
"gives": [
"sponsee",
"love_touch"
],
"say": "Jaz: “you make time for the bar, you can make time for a kid who’s trying.” She wasn’t wrong."
}
},
"expire": {
"h": 6,
"s": 10,
"c": 0,
"n": -6,
"trust": {
"pops": -1
},
"say": "You never gave him an answer. Dre asked a guy with a nicer car instead. That guy relapsed in March and took Dre with him."
},
"need": [
"sponsor",
"nosponsee"
],
"once": true,
"weight": 2,
"late": false
},
{
"id": "jaz_pregnant",
"ch": 3,
"scale": "week",
"title": "WE NEED TO TALK",
"who": "love",
"setup": "Jaz texts “we need to talk” and then nothing for four hours. She comes over with a bag from the pharmacy and sits on the couch you got off the curb. Two lines. She’s crying and laughing at the same time. You have $300, a hundred and twenty days, and a car with a check engine light. She’s looking at you like whatever you say next is going to matter for the rest of your life.",
"now": 10,
"daily": 8,
"days": 2,
"moves": {
"meeting": {
"h": -10,
"s": -6,
"c": 0,
"n": 14,
"trust": {
"love": 4,
"pops": 2
},
"end": true,
"gives": [
"pregnant",
"love_touch"
],
"say": "You went to a meeting and said it out loud. Then you went back and said the only thing that mattered: “I’m here. I’m not going anywhere.”"
},
"call": {
"h": -8,
"s": -8,
"c": 0,
"n": 10,
"trust": {
"love": 3,
"pops": 2
},
"end": true,
"gives": [
"pregnant",
"love_touch"
],
"say": "Pops: “You scared?” Yes. “Good. Scared men show up. Go back in there.” You did."
},
"help": {
"h": -6,
"s": -4,
"c": -40,
"n": 14,
"trust": {
"love": 4,
"mom": 1
},
"end": true,
"gives": [
"pregnant",
"love_touch"
],
"say": "You drove her to the first appointment and held the clipboard. The nurse called you “Dad.” You almost dropped it."
},
"rest": {
"h": -5,
"s": -10,
"c": 0,
"n": 6,
"trust": {
"love": 2
},
"end": true,
"gives": [
"pregnant",
"love_touch"
],
"say": "You didn’t say anything. You stayed. By morning that was the answer."
},
"work": {
"h": 8,
"s": 14,
"c": 0,
"n": -2,
"trust": {
"love": 1,
"darlene": 1
},
"end": true,
"gives": [
"pregnant"
],
"say": "You pulled a double the next day. She understood. Sort of. Money’s a kind of showing up. Not the only kind."
},
"argue": {
"h": 18,
"s": -10,
"c": 0,
"n": -10,
"trust": {
"love": -5
},
"end": true,
"gives": [
"pregnant"
],
"say": "You asked. Out loud. She left. She came back a week later because she had nowhere else to go. Not because of you."
},
"ignore": {
"h": 14,
"s": -12,
"c": -20,
"n": -10,
"trust": {
"love": -4,
"mom": -2
},
"end": true,
"gives": [
"pregnant"
],
"say": "You said you needed air. You drove for three hours. She was gone when you got back."
},
"fkit": {
"h": 25,
"s": -20,
"c": -30,
"n": -8,
"trust": {
"love": -3,
"pops": -3
},
"end": true,
"gives": [
"pregnant"
],
"say": "You thought at the bar. Six sodas. The bartender asked if you were celebrating. You didn’t know."
},
"ex": {
"h": 10,
"s": -10,
"c": 0,
"n": -8,
"trust": {
"love": -6
},
"end": true,
"gives": [
"pregnant"
],
"say": "You texted the ex. Jaz saw the phone. There is no coming back from the ex’s name on your screen that night."
},
"date": {
"h": -4,
"s": -8,
"c": -40,
"n": 14,
"trust": {
"love": 4,
"mom": 3
},
"end": true,
"gives": [
"pregnant",
"love_touch"
],
"say": "You drove Jaz to Mom’s and said it together at the kitchen table. Mom cried, then started making a list."
},
"look": {
"h": 0,
"s": -8,
"c": -200,
"n": 8,
"trust": {
"love": 3
},
"end": true,
"gives": [
"pregnant",
"love_touch"
],
"say": "You bought a crib that night. Jaz said “you’re insane.” She was smiling."
}
},
"expire": {
"h": 10,
"s": 22,
"c": 0,
"n": -8,
"trust": {
"love": -4,
"mom": -1
},
"say": "You said nothing for a week. She stopped waiting for you to say something. Her mom’s doing the doctor visits now."
},
"need": [
"together",
"notpregnant",
"sober45"
],
"once": true,
"weight": 3,
"late": true,
"girl": {
"setup": "You’ve been sick for a week and blaming the warehouse. Marc brought the bag from the pharmacy without being asked. Two lines. You’re sitting on the couch you got off the curb, crying and laughing at the same time. You have $300, a hundred and twenty days, and a car with a check engine light. Marc is looking at you like whatever you say next is going to matter for the rest of your life."
}
},
{
"id": "ex_amends",
"ch": 4,
"scale": "month",
"title": "THE EX WANTS TO TALK",
"who": "ex",
"setup": "The ex calls from a number you don’t have blocked. Not 3 AM this time. Noon. Sober voice. “I’m in a program too now. I owe you an amends. Can we meet?” You owe one back. You also know how it ends every time you two are in a room. Pops says amends don’t require a reunion.",
"now": 8,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": 0,
"n": 10,
"trust": {
"pops": 2,
"love": 1
},
"end": true,
"gives": [],
"say": "You said “meet me at the Thursday meeting.” Public, bright, Pops in the room. Two amends, one hug, no number exchanged."
},
"call": {
"h": -10,
"s": -8,
"c": -10,
"n": 8,
"trust": {
"pops": 2
},
"end": true,
"gives": [],
"say": "Pops: “Coffee shop. Daytime. Thirty minutes. Say yours, hear theirs, leave.” You followed it to the minute."
},
"help": {
"h": -8,
"s": -5,
"c": -5,
"n": 6,
"trust": {
"pops": 1,
"love": 1
},
"end": true,
"gives": [],
"say": "You wrote your amends and mailed it. A letter. The ex sent one back. That was enough."
},
"rest": {
"h": -5,
"s": -10,
"c": 0,
"n": -2,
"trust": {},
"end": true,
"gives": [],
"say": "You said not yet. Pops said that’s allowed. The ex said “okay” like it was a door closing."
},
"work": {
"h": 6,
"s": 10,
"c": 80,
"n": -2,
"trust": {
"love": 1
},
"end": false,
"gives": [],
"say": "You hid behind the schedule. The ex saw through it. So did you."
},
"argue": {
"h": 12,
"s": -10,
"c": 0,
"n": -6,
"trust": {
"pops": -2
},
"end": true,
"gives": [],
"say": "You met and spent the whole hour on their list instead of yours. The ex cried. You felt like garbage, correctly."
},
"ignore": {
"h": 6,
"s": -8,
"c": 0,
"n": -4,
"trust": {},
"end": true,
"gives": [],
"say": "Blocked. Again. It felt like strength. Pops said it looked like fear."
},
"fkit": {
"h": 25,
"s": -20,
"c": -30,
"n": -6,
"trust": {
"love": -5,
"pops": -2
},
"end": true,
"gives": [],
"say": "The old bar. Just talking. Then the ex’s hand on your arm. You left at midnight, sober and sick about it. Jaz saw the time stamp."
},
"ex": {
"h": 22,
"s": -22,
"c": 0,
"n": -8,
"trust": {
"love": -6,
"pops": -3
},
"end": true,
"gives": [],
"say": "You went to the apartment. Nothing good happens at the ex’s apartment. Nothing good did."
},
"date": {
"h": -4,
"s": -6,
"c": -20,
"n": 10,
"trust": {
"love": 3,
"pops": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "You told Jaz before you went. She said “okay. text me when you leave.” You texted at 1:34 PM: “done. love you.”"
}
},
"expire": {
"h": 8,
"s": 10,
"c": 0,
"n": -3,
"trust": {
"love": -1
},
"say": "You never called back. The ex left a long voicemail you listened to twice and deleted once."
},
"need": [],
"once": true,
"weight": 1,
"late": false
},
{
"id": "dre_court",
"ch": 4,
"scale": "month",
"title": "DRE’S COURT DATE",
"who": "newcomer",
"setup": "Dre’s court date is the 15th at 9 AM. Downtown. He has no car and no suit. If he misses it there’s a warrant. The 15th is also the day the property manager wants to meet about the lots, the day Darlene’s doing the quarterly, and Jaz’s ultrasound is at 10:30. You’re his sponsor. You have one body.",
"now": 8,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -10,
"s": -6,
"c": 0,
"n": 12,
"trust": {
"pops": 2,
"love": 1
},
"end": true,
"gives": [],
"say": "You asked the room. Sal drove Dre in a suit from the church closet. You made the ultrasound."
},
"call": {
"h": -10,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "Pops took Dre to court in Pops’ Buick and his own funeral suit. Judge gave Dre probation. Pops gave Dre a lecture."
},
"help": {
"h": -8,
"s": -4,
"c": -20,
"n": 14,
"trust": {
"pops": 3,
"shorty": 1,
"love": -1,
"darlene": -1
},
"end": true,
"gives": [],
"say": "You drove Dre downtown at 8, sat in the back row, and watched a judge give the kid a second chance. Jaz went to the ultrasound with her mom."
},
"rides": {
"h": -8,
"s": 0,
"c": -120,
"n": 14,
"trust": {
"pops": 2,
"love": 2
},
"end": true,
"gives": [
"love_touch"
],
"say": "You did both. Barely. Speeding. Dre got probation, Jaz got a picture, you got a ticket."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {
"pops": -2
},
"end": false,
"gives": [],
"say": "You told him the bus. He missed the transfer. Warrant."
},
"work": {
"h": 6,
"s": 12,
"c": 0,
"n": -6,
"trust": {
"darlene": 2,
"pops": -2
},
"end": true,
"gives": [],
"say": "You chose the quarterly. Darlene noticed. So did the judge, in a way: Dre showed up alone and got the max."
},
"double": {
"h": 8,
"s": 18,
"c": -400,
"n": -2,
"trust": {
"pops": 1,
"darlene": 1,
"love": -1
},
"end": true,
"gives": [],
"say": "You couldn’t be there, so you paid for a real lawyer with double money. Dre got probation. He still wanted you in the room."
},
"argue": {
"h": 12,
"s": -8,
"c": 0,
"n": -8,
"trust": {
"pops": -2
},
"end": true,
"gives": [],
"say": "You said a sponsor isn’t a chauffeur. True in the book. Dre heard “you’re on your own.”"
},
"ignore": {
"h": 14,
"s": -10,
"c": 0,
"n": -10,
"trust": {
"pops": -3,
"shorty": -1
},
"end": true,
"gives": [],
"say": "You forgot. He didn’t. Warrant."
},
"fkit": {
"h": 22,
"s": -15,
"c": 0,
"n": -10,
"trust": {
"pops": -3,
"ghost": 1
},
"end": true,
"gives": [],
"say": "“Warrants don’t mean nothing.” He skipped it. Warrants mean something."
},
"date": {
"h": -6,
"s": -6,
"c": -30,
"n": 14,
"trust": {
"love": 3,
"pops": 2
},
"end": true,
"gives": [
"love_touch"
],
"say": "You went to the ultrasound at 8 (they moved it), then flew downtown. Dre was on the steps, waiting. You walked in together."
}
},
"expire": {
"h": 10,
"s": 16,
"c": 0,
"n": -6,
"trust": {
"pops": -2
},
"say": "Dre missed court. There’s a warrant. He’s back at the house, scared to leave it. You told yourself it wasn’t your job."
},
"need": [
"sponsee"
],
"once": true,
"weight": 2,
"late": false
},
{
"id": "first_client",
"ch": 4,
"scale": "month",
"title": "THE LADY WITH THE LOTS",
"who": "client",
"setup": "Ms. Patel manages six rental properties and watched you clear your neighbor’s yard from her car. She wants a quote for all six, every two weeks, through October. It’s real money: $900 a month. It’s also a truck you don’t have, a mower that starts on the third pull, and a lot of Saturdays. “I need somebody who shows up,” she says. Everybody keeps saying that.",
"now": 4,
"daily": 4,
"days": 2,
"moves": {
"meeting": {
"h": -10,
"s": -6,
"c": -50,
"n": 10,
"trust": {
"pops": 1
},
"end": true,
"gives": [
"bizseed"
],
"say": "You asked the meeting. Sal has a truck he doesn’t use. $50 a weekend. You sent the quote. She said yes."
},
"call": {
"h": -8,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"bizseed"
],
"say": "Pops: “Can you push a mower? Can you show up? Then you can run a business. Everything else is paperwork.”"
},
"help": {
"h": -6,
"s": -2,
"c": -60,
"n": 12,
"trust": {
"pops": 2,
"shorty": 1
},
"end": true,
"gives": [
"bizseed"
],
"say": "You hired Dre for $15 an hour. He showed up early. You sent the quote. She said yes."
},
"rest": {
"h": -5,
"s": -12,
"c": 0,
"n": -2,
"trust": {},
"end": false,
"gives": [],
"say": "You thought about it for three weeks. She hired a company with a logo."
},
"work": {
"h": 6,
"s": 4,
"c": 0,
"n": -2,
"trust": {
"darlene": 1
},
"end": true,
"gives": [],
"say": "You said no. Safe. Darlene was glad. You still look at the lots when you drive past."
},
"double": {
"h": 10,
"s": 22,
"c": 900,
"n": -4,
"trust": {
"darlene": 1,
"love": -2,
"mom": -1
},
"end": true,
"gives": [
"bizseed"
],
"say": "Warehouse all week, lots all weekend. $900 extra a month. You slept in the truck once."
},
"quit": {
"h": 12,
"s": -10,
"c": 400,
"n": 2,
"trust": {
"darlene": -3,
"pops": 1
},
"end": true,
"gives": [
"bizseed"
],
"say": "You quit Darlene and went all in on six lots and a mower. Month one was terrifying. Month two was $900."
},
"argue": {
"h": 8,
"s": -8,
"c": 0,
"n": -4,
"trust": {},
"end": true,
"gives": [],
"say": "You quoted $1,500 a month out of fear. She said “no thank you” nicely. Nicely is worse."
},
"ignore": {
"h": 6,
"s": -6,
"c": 0,
"n": -4,
"trust": {},
"end": true,
"gives": [],
"say": "You didn’t send it. Logos. Trucks. Every day."
},
"fkit": {
"h": 20,
"s": -15,
"c": 300,
"n": -12,
"trust": {
"pops": -2,
"ghost": 1
},
"end": true,
"gives": [],
"say": "You took a $300 deposit, did one lot, and stopped answering. She told everybody."
},
"bizfund": {
"h": 0,
"s": -6,
"c": 0,
"n": 8,
"trust": {
"pops": 1
},
"end": true,
"gives": [
"bizseed"
],
"say": "You emptied the stack on a used truck and a mower that starts first pull. Quote sent. “When can you start?”"
},
"date": {
"h": 0,
"s": -8,
"c": -30,
"n": 8,
"trust": {
"love": 2
},
"end": true,
"gives": [
"bizseed",
"love_touch"
],
"say": "Jaz did the quote on her laptop in twenty minutes with a logo and everything. “You’re welcome. I get ten percent.”"
}
},
"expire": {
"h": 6,
"s": 8,
"c": 0,
"n": -3,
"trust": {},
"say": "You never sent the quote. Ms. Patel hired a company with a logo. You drive past their trucks every day."
},
"need": [
"nobiz",
"ownplace"
],
"once": true,
"weight": 2,
"late": false
},
{
"id": "warrant_check",
"ch": 4,
"scale": "month",
"title": "THE OLD WARRANT",
"who": "unknown",
"setup": "A letter from a county you haven’t been to in years. A bench warrant from a case you walked away from before you got sober. Failure to appear. Pops says you handle it: show up, turn yourself in, take the hit. The lawyer on the bus ad says $500 to make it go away. Ghost says just don’t drive through that county.",
"now": 14,
"daily": 10,
"days": 3,
"moves": {
"meeting": {
"h": -16,
"s": -10,
"c": -150,
"n": 10,
"trust": {
"pops": 2
},
"end": true,
"gives": [],
"say": "You went to a meeting, then walked into the courthouse with Pops. Two hours, a fine, a date. Done. The judge said “good luck.”"
},
"call": {
"h": -14,
"s": -10,
"c": -150,
"n": 8,
"trust": {
"pops": 2
},
"end": true,
"gives": [],
"say": "Pops drove you. You turned yourself in at 8 AM with a coffee in your hand. Processed and out by noon. A fine. A clean name."
},
"help": {
"h": -10,
"s": -6,
"c": -100,
"n": 4,
"trust": {},
"end": true,
"gives": [],
"say": "You called the public defender. A kid in a bad suit got it reduced to a fine over the phone."
},
"rest": {
"h": -5,
"s": -15,
"c": 0,
"n": 1,
"trust": {},
"end": false,
"gives": [],
"say": "You stayed in the apartment for a week. The warrant stayed in the system."
},
"work": {
"h": -8,
"s": -8,
"c": -500,
"n": 0,
"trust": {},
"end": true,
"gives": [],
"say": "$500 to the lawyer on the bus. He made one call. It worked. You’re broke and clean."
},
"double": {
"h": -6,
"s": 10,
"c": -500,
"n": -4,
"trust": {
"love": -1,
"darlene": 1
},
"end": true,
"gives": [],
"say": "You doubled for two weeks and paid the lawyer. Jaz asked if you were avoiding her. You were avoiding a warrant."
},
"argue": {
"h": 12,
"s": -8,
"c": 0,
"n": -2,
"trust": {},
"end": false,
"gives": [],
"say": "You argued with a clerk for an hour. She added a note to your file. Clerks always win."
},
"ignore": {
"h": 20,
"s": -6,
"c": -300,
"n": -6,
"trust": {},
"end": true,
"gives": [],
"say": "You avoided the county. Then you drove through it to get Dre’s mom to a funeral. The stop took four hours."
},
"fkit": {
"h": 22,
"s": -18,
"c": 0,
"n": -6,
"trust": {
"ghost": 1
},
"end": true,
"gives": [],
"say": "You tore up the letter. They have copies."
},
"ghostlink": {
"h": 14,
"s": -12,
"c": 0,
"n": 0,
"trust": {
"ghost": 2,
"pops": -2
},
"end": true,
"gives": [
"oldcontact"
],
"say": "Ghost: “Just don’t go there, and don’t get pulled over.” That’s not a trick. That’s a countdown."
},
"block": {
"h": 10,
"s": -8,
"c": -200,
"n": 2,
"trust": {},
"end": true,
"gives": [],
"say": "The block knew a guy who knew a guy. The guy took $200 and vanished."
}
},
"expire": {
"h": 20,
"s": 15,
"c": 0,
"n": -4,
"trust": {},
"say": "You did nothing. A traffic stop in March ran your name. The old county had a surprise waiting."
},
"need": [],
"once": true,
"weight": 1,
"late": false
},
{
"id": "pops_diagnosis",
"ch": 5,
"scale": "month",
"title": "POPS IS SICK",
"who": "pops",
"setup": "Pops didn’t make the Thursday meeting. Pops always makes the Thursday meeting. He calls you from a hospital bed like it’s nothing. “It’s the pancreas. They’re gonna try some things.” He’s got nobody. Twenty-four years sober, a hundred sponsees, and nobody on the emergency contact line. He asks if you’d mind being on it.",
"now": 6,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -14,
"s": -10,
"c": 0,
"n": 16,
"trust": {
"pops": 4,
"shorty": 1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You brought the Thursday meeting to the hospital. Eleven folding chairs in a room built for two. The nurses let it slide."
},
"call": {
"h": -10,
"s": -12,
"c": 0,
"n": 12,
"trust": {
"pops": 4
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You said yes. Then you learned what it means: forms, 3 AM calls, a doctor who talks to you like family. You are, apparently."
},
"help": {
"h": -8,
"s": -8,
"c": -40,
"n": 14,
"trust": {
"pops": 4,
"mom": 1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "Every night after work. He pretended to hate it. He asked what time you were coming the next day."
},
"rides": {
"h": -10,
"s": -6,
"c": -60,
"n": 14,
"trust": {
"pops": 4
},
"end": true,
"gives": [
"pops_sick"
],
"say": "Chemo Tuesdays. Scans Fridays. You know the hospital parking garage better than your own street."
},
"rest": {
"h": -5,
"s": -10,
"c": 0,
"n": 2,
"trust": {
"pops": 1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You went once. He looked small. You didn’t go back for two weeks. He noticed."
},
"work": {
"h": 6,
"s": 10,
"c": 0,
"n": 4,
"trust": {
"pops": 2,
"darlene": 1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You worked all week and sat with him Saturdays. He said that was plenty. He was lying to make it easy on you."
},
"double": {
"h": 8,
"s": 16,
"c": -300,
"n": 6,
"trust": {
"pops": 3,
"love": -1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You paid his copays with double money. He found out and yelled. Then he cried. Then he yelled again."
},
"argue": {
"h": 6,
"s": -8,
"c": 0,
"n": 4,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You told him to fight. He said “son, I been fighting since before you were born. Sit down.” You sat."
},
"ignore": {
"h": 14,
"s": -10,
"c": 0,
"n": -8,
"trust": {
"pops": -2,
"shorty": -1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You couldn’t do hospitals. You told yourself he’d understand. He did. That’s what made it worse."
},
"fkit": {
"h": 24,
"s": -20,
"c": -30,
"n": -6,
"trust": {
"pops": -2,
"ghost": 1
},
"end": true,
"gives": [
"pops_sick"
],
"say": "You sat at the bar with a soda, thinking about Pops dying. The bartender left you alone. The smell didn’t."
},
"date": {
"h": -6,
"s": -8,
"c": -30,
"n": 12,
"trust": {
"pops": 3,
"love": 3
},
"end": true,
"gives": [
"pops_sick",
"love_touch"
],
"say": "You brought Jaz. Pops told her every embarrassing story he had. She brought him soup every week after."
}
},
"expire": {
"h": 8,
"s": 20,
"c": 0,
"n": -6,
"trust": {
"pops": -3
},
"say": "You said you’d visit and kept not visiting. Pops stopped mentioning it. Pops never mentions anything twice."
},
"need": [
"popswell",
"sponsor",
"sober200"
],
"once": true,
"weight": 3,
"late": false
},
{
"id": "pops_hospital",
"ch": 5,
"scale": "month",
"title": "POPS’ BAD WEEK",
"who": "pops",
"setup": "The hospital calls at 4 AM. Pops took a turn. He’s asking for you, and he never asks for anything. It’s the same week as the biggest job your business has ever had: twelve lots, a $2,000 check, Ms. Patel watching. Dre is supposed to run the crew but Dre has never run anything. Pops is asking for you.",
"now": 8,
"daily": 8,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -6,
"c": -300,
"n": 14,
"trust": {
"pops": 4,
"shorty": 1
},
"end": true,
"gives": [],
"say": "You went to a meeting, then to Pops. Dre ran the crew. He lost a rake and a client. He also finished all twelve lots."
},
"call": {
"h": -10,
"s": -8,
"c": -200,
"n": 12,
"trust": {
"pops": 4
},
"end": true,
"gives": [],
"say": "You handed Dre the keys and the clipboard. He called you nine times. He did it. Pops held your hand and said “good.”"
},
"help": {
"h": -8,
"s": -10,
"c": -1200,
"n": 14,
"trust": {
"pops": 5,
"mom": 1
},
"end": true,
"gives": [],
"say": "You sat with Pops for five days. Ms. Patel hired the logo company. You’d do it again."
},
"rides": {
"h": -8,
"s": 10,
"c": 0,
"n": 12,
"trust": {
"pops": 4
},
"end": true,
"gives": [],
"say": "5 AM hospital, noon lots, 8 PM hospital. Seven days. You lost six pounds and no clients. Pops noticed the sunburn."
},
"rest": {
"h": -5,
"s": -6,
"c": 0,
"n": 0,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "You went once, then worked. He understood. He always understands. You wish he didn’t have to."
},
"work": {
"h": 6,
"s": 12,
"c": 0,
"n": -4,
"trust": {
"pops": -1,
"darlene": 1
},
"end": true,
"gives": [],
"say": "You finished the lots. Pops was asleep when you got there every night. You left the check on his tray. He didn’t need a check."
},
"double": {
"h": 10,
"s": 26,
"c": 0,
"n": 6,
"trust": {
"pops": 3,
"love": -1
},
"end": true,
"gives": [],
"say": "You did it all. Hospital, lots, Jaz. You fell asleep at a red light. Nobody got hurt. That was luck."
},
"argue": {
"h": 10,
"s": -6,
"c": 0,
"n": -4,
"trust": {
"pops": -1
},
"end": true,
"gives": [],
"say": "You snapped at a nurse. She’d been up thirty hours too. Pops heard it. “That’s not you, son.”"
},
"ignore": {
"h": 16,
"s": -10,
"c": 400,
"n": -10,
"trust": {
"pops": -4,
"shorty": -2
},
"end": true,
"gives": [],
"say": "You didn’t go. You told yourself you’d go tomorrow. You finished the lots. Tomorrow kept moving."
},
"fkit": {
"h": 28,
"s": -25,
"c": -60,
"n": -8,
"trust": {
"pops": -3,
"ghost": 2
},
"end": true,
"gives": [
"oldcontact"
],
"say": "You went to the old block to not feel it. It worked for an hour. Ghost found you on the corner. “Rough week?”"
},
"date": {
"h": -4,
"s": -4,
"c": 0,
"n": 12,
"trust": {
"love": 3,
"pops": 3
},
"end": true,
"gives": [
"love_touch"
],
"say": "Jaz sat with Pops every afternoon while you worked. He told her every embarrassing story he had left. She wrote them down."
}
},
"expire": {
"h": 10,
"s": 24,
"c": -500,
"n": -8,
"trust": {
"pops": -3
},
"say": "You tried to do all of it. You did none of it well. Pops slept through your visit. Ms. Patel found somebody with a logo."
},
"need": [
"popssick",
"biz"
],
"once": true,
"weight": 3,
"late": false
},
{
"id": "dre_relapse",
"ch": 5,
"scale": "month",
"title": "DRE WENT OUT",
"who": "newcomer",
"setup": "Dre calls at 2:40 AM from the block. High. Crying. “I messed up. I messed up. Don’t tell Pops.” He wants you to come get him. You know the corner. You know what’s on it. You have two hundred days and Jaz asleep in the next room. Pops always said: you don’t go alone. Pops is in the hospital.",
"now": 16,
"daily": 12,
"days": 1,
"moves": {
"meeting": {
"h": -10,
"s": -8,
"c": 0,
"n": 16,
"trust": {
"pops": 3,
"shorty": 2
},
"end": true,
"gives": [],
"say": "You called Sal and Benny. Three of you went. Dre got in the car without a word. He detoxed on your couch with Jaz making him eggs."
},
"call": {
"h": -8,
"s": -8,
"c": 0,
"n": 14,
"trust": {
"shorty": 3,
"pops": 2
},
"end": true,
"gives": [],
"say": "Shorty was in the car in four minutes. You drove, Shorty talked Dre into the back seat. Nobody got out of the car."
},
"help": {
"h": 0,
"s": -5,
"c": 0,
"n": 14,
"trust": {
"pops": 2
},
"end": true,
"gives": [],
"say": "You pulled up, honked twice, kept the engine running. Dre came out. Two minutes. Your hands shook the whole way home."
},
"rides": {
"h": -4,
"s": -4,
"c": 0,
"n": 12,
"trust": {
"pops": 2
},
"end": true,
"gives": [],
"say": "You stayed in the car with the doors locked and the phone on speaker. He walked to you. That was the deal."
},
"rest": {
"h": -6,
"s": -8,
"c": -20,
"n": 12,
"trust": {
"pops": 2
},
"end": true,
"gives": [],
"say": "You told him the gas station, four blocks off. He made it. You bought him a coffee at 3 AM and drove him to detox."
},
"work": {
"h": 6,
"s": 12,
"c": -40,
"n": -6,
"trust": {
"pops": -2
},
"end": true,
"gives": [],
"say": "You sent a cab. He didn’t get in it. He called at 5 AM, worse."
},
"argue": {
"h": 8,
"s": -8,
"c": 0,
"n": 2,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "You yelled. He hung up. He was at your door at 7 AM anyway, still high, still crying. You let him in."
},
"ignore": {
"h": 14,
"s": -10,
"c": 0,
"n": -12,
"trust": {
"pops": -3,
"shorty": -2
},
"end": true,
"gives": [],
"say": "You let it ring. You lay there and listened to it ring."
},
"fkit": {
"h": 30,
"s": -15,
"c": -40,
"n": 4,
"trust": {
"pops": -1,
"ghost": 2
},
"end": true,
"gives": [
"oldcontact"
],
"say": "You went alone. You found him. You found everything else too. You stayed a minute. Then another. Then you got in the car with him and drove. Sober. Barely."
},
"ghostlink": {
"h": 18,
"s": -12,
"c": 0,
"n": -2,
"trust": {
"ghost": 3,
"pops": -3
},
"end": true,
"gives": [
"oldcontact"
],
"say": "Ghost went and got him. Ghost was already there. That’s how Ghost knew."
},
"block": {
"h": 6,
"s": -6,
"c": 0,
"n": 10,
"trust": {
"love": 2,
"pops": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "You woke Jaz. She said “I’m coming.” Jaz in the passenger seat at 3 AM with her arms crossed. Dre took one look at her and got in."
}
},
"expire": {
"h": 14,
"s": 24,
"c": 0,
"n": -8,
"trust": {
"pops": -2,
"shorty": -1
},
"say": "You didn’t pick up. Dre walked home at dawn. He never called you again. He calls Ghost now."
},
"need": [
"sponsee"
],
"once": false,
"weight": 3,
"late": false
},
{
"id": "big_contract",
"ch": 5,
"scale": "month",
"title": "TWELVE LOTS",
"who": "client",
"setup": "Ms. Patel’s boss owns forty-one properties. He wants a bid on twelve of them, year-round. $2,000 a month. It needs a second truck, a second crew, and insurance you don’t have. If you land it you’re a real company. If you take it and can’t deliver, you’re the guy with the logo who didn’t show up.",
"now": 4,
"daily": 4,
"days": 2,
"moves": {
"meeting": {
"h": -10,
"s": -6,
"c": -200,
"n": 12,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"bigjob"
],
"say": "You asked the meeting. Four guys with six months and nothing to do Saturdays. Bid sent. Bid won."
},
"call": {
"h": -8,
"s": -8,
"c": 0,
"n": 8,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"bigjob"
],
"say": "Pops, from a hospital bed: “You were ready when you started showing up. Bid it.” You bid it."
},
"help": {
"h": -6,
"s": -4,
"c": -300,
"n": 12,
"trust": {
"pops": 2,
"shorty": 1
},
"end": true,
"gives": [
"bigjob"
],
"say": "You made Dre a foreman. He bought a clipboard with his own money. Bid won."
},
"rest": {
"h": -5,
"s": -8,
"c": 0,
"n": -2,
"trust": {},
"end": true,
"gives": [],
"say": "You said no. Safe. The lots stayed six. The logo company got twelve."
},
"work": {
"h": 8,
"s": 16,
"c": 500,
"n": 4,
"trust": {},
"end": true,
"gives": [
"bigjob"
],
"say": "You bid it. You won it. You figured it out one lot at a time. Sleep is for people without twelve lots."
},
"double": {
"h": 10,
"s": 24,
"c": 900,
"n": 2,
"trust": {
"love": -2,
"pops": 1
},
"end": true,
"gives": [
"bigjob"
],
"say": "Eighteen lots. Two crews. One you. Jaz said she forgot what you look like."
},
"quit": {
"h": 6,
"s": -10,
"c": 4000,
"n": -4,
"trust": {
"darlene": 1,
"pops": -1
},
"end": true,
"gives": [],
"say": "They offered $4,000 for your clients. You took it. Back to the warehouse Monday."
},
"argue": {
"h": 10,
"s": 10,
"c": 300,
"n": 0,
"trust": {},
"end": true,
"gives": [
"bigjob"
],
"say": "You bid too low to beat the logo guys. You won. You’re losing money on every lot."
},
"ignore": {
"h": 6,
"s": -4,
"c": 0,
"n": -4,
"trust": {},
"end": true,
"gives": [],
"say": "The bid was due Friday. You remembered Monday."
},
"fkit": {
"h": 20,
"s": -20,
"c": -300,
"n": -6,
"trust": {
"pops": -2,
"ghost": 1
},
"end": true,
"gives": [],
"say": "You threw a party for a contract you hadn’t won. Ms. Patel’s boss saw the pictures."
},
"bizfund": {
"h": 0,
"s": -6,
"c": 0,
"n": 8,
"trust": {
"pops": 1
},
"end": true,
"gives": [
"bigjob"
],
"say": "You bought the truck, then bid. “Already equipped.” That line won it."
},
"date": {
"h": 0,
"s": -8,
"c": -50,
"n": 10,
"trust": {
"love": 3
},
"end": true,
"gives": [
"bigjob",
"love_touch"
],
"say": "Jaz built a bid with a spreadsheet and a cover letter. Ms. Patel’s boss said it was the only professional one he got."
}
},
"expire": {
"h": 6,
"s": 10,
"c": 0,
"n": -2,
"trust": {},
"say": "You never bid. The logo company got it. You still do Ms. Patel’s six. She says “I tried” every time she sees you."
},
"need": [
"biz"
],
"once": true,
"weight": 2,
"late": false
},
{
"id": "truck_dies",
"ch": 5,
"scale": "month",
"title": "THE TRUCK DIED",
"who": "mechanic",
"setup": "The truck died on the highway with a trailer full of mowers and twelve lots due Friday. The mechanic says transmission. $1,800 or a new truck. You have four days, a crew waiting on a text, and a client who’s heard every excuse from every guy with a logo.",
"now": 8,
"daily": 8,
"days": 2,
"moves": {
"meeting": {
"h": -10,
"s": -6,
"c": -900,
"n": 10,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "You asked the room. Sal’s truck for a week, and Benny knows a transmission guy. Friday got done."
},
"call": {
"h": -8,
"s": -8,
"c": -1100,
"n": 6,
"trust": {
"pops": 1
},
"end": true,
"gives": [],
"say": "Pops’ guy rebuilt it for $1,100 and a case of ginger ale. “Tell Pops he still owes me from ’94.”"
},
"help": {
"h": -6,
"s": 4,
"c": -400,
"n": 12,
"trust": {
"shorty": 1,
"pops": 1
},
"end": true,
"gives": [],
"say": "You and Dre pushed the mowers four blocks to the three closest lots. Ms. Patel drove by, laughed, and extended the contract."
},
"rest": {
"h": -5,
"s": -12,
"c": -1800,
"n": 8,
"trust": {},
"end": true,
"gives": [],
"say": "You called and said the truck died and you’d be three days late. She said “you’re the first one who ever called.”"
},
"work": {
"h": 6,
"s": 10,
"c": -1800,
"n": 0,
"trust": {},
"end": true,
"gives": [],
"say": "$1,800. The whole month’s profit. Truck fixed Wednesday. Lots done Friday. Jaz did the math out loud at dinner."
},
"double": {
"h": 8,
"s": 20,
"c": -700,
"n": 2,
"trust": {
"love": -1
},
"end": true,
"gives": [],
"say": "A rental, headlights, and two 16-hour days. Friday done. You slept Saturday. All of it."
},
"quit": {
"h": 6,
"s": -12,
"c": 800,
"n": -4,
"trust": {
"darlene": 2,
"pops": -1
},
"end": true,
"gives": [],
"say": "You sold the mowers and went back to the warehouse. Darlene said “I kept your locker.”"
},
"argue": {
"h": 10,
"s": -6,
"c": -1800,
"n": -2,
"trust": {},
"end": true,
"gives": [],
"say": "You said transmission was a scam. He showed you the transmission. In pieces. On the floor."
},
"ignore": {
"h": 8,
"s": -6,
"c": 0,
"n": -8,
"trust": {},
"end": true,
"gives": [],
"say": "Trucks don’t. Friday came. The crew went home."
},
"fkit": {
"h": 22,
"s": -18,
"c": 500,
"n": -6,
"trust": {
"ghost": 3,
"pops": -2
},
"end": true,
"gives": [
"oldcontact"
],
"say": "Ghost bought the mowers for a third of what they cost and asked if you wanted to make some real money."
},
"bizfund": {
"h": 0,
"s": -4,
"c": 0,
"n": 6,
"trust": {},
"end": true,
"gives": [],
"say": "You pulled the stack and bought a second truck. Two trucks, one works. That’s a fleet."
}
},
"expire": {
"h": 10,
"s": 18,
"c": -600,
"n": -6,
"trust": {},
"say": "You missed Friday. Then the next Friday. Ms. Patel’s boss hired the logo guys. The truck sat in the driveway all winter like a monument."
},
"need": [
"biz"
],
"once": true,
"weight": 1,
"late": false
},
{
"id": "baby_comes",
"ch": 5,
"scale": "month",
"title": "THE BABY",
"who": "love",
"setup": "Jaz’s water breaks at 3 AM in the kitchen. You have a car with a check engine light, a crew that starts at 7, and a hospital bag by the door that she packed two weeks ago because she knew you wouldn’t. Twenty-six hours later, somebody hands you a person. The nurse asks for the father’s name. It takes you a second to realize she means you.",
"now": 6,
"daily": 6,
"days": 1,
"moves": {
"meeting": {
"h": -10,
"s": -8,
"c": -100,
"n": 16,
"trust": {
"love": 4,
"pops": 2,
"mom": 2
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "You texted the Thursday meeting from the hallway: “it’s a girl.” Forty replies in a minute. Pops sent a thumbs up from his hospital bed."
},
"call": {
"h": -8,
"s": -6,
"c": -100,
"n": 14,
"trust": {
"love": 3,
"mom": 4
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "You called Mom at 3:15 AM. She was dressed before you hung up. She was there before you parked."
},
"help": {
"h": -6,
"s": -4,
"c": -200,
"n": 16,
"trust": {
"love": 5,
"mom": 2
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "Twenty-six hours. You didn’t leave. You didn’t check your phone. Dre ran the crew. The nurse said “that’s a good one” about you, to Jaz."
},
"rides": {
"h": -8,
"s": 0,
"c": -100,
"n": 14,
"trust": {
"love": 4
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "3 AM, check engine light, forty over. You made the hospital in eleven minutes. Then you waited twenty-six hours."
},
"rest": {
"h": -5,
"s": -10,
"c": -100,
"n": 12,
"trust": {
"love": 3
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "You slept in the chair. Jaz woke you up to hold her. Her. The baby. Both."
},
"work": {
"h": 6,
"s": 14,
"c": 300,
"n": -2,
"trust": {
"love": -1,
"mom": -1
},
"end": true,
"gives": [
"baby_born"
],
"say": "You dropped her off and went to work. She said go. She didn’t mean it. You got back at the end. Her mom was already holding the baby."
},
"double": {
"h": 8,
"s": 20,
"c": 600,
"n": -4,
"trust": {
"love": -2,
"darlene": 1
},
"end": true,
"gives": [
"baby_born"
],
"say": "You worked. Twelve lots. Then the hospital bill came and you understood why you worked. Jaz understood too. Eventually."
},
"argue": {
"h": 8,
"s": -6,
"c": -100,
"n": 6,
"trust": {
"love": 1
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "You argued with a nurse about the parking validation during a contraction. Jaz says it’s her favorite story about you now."
},
"ignore": {
"h": 10,
"s": -10,
"c": -100,
"n": -2,
"trust": {
"love": -2,
"mom": -1
},
"end": true,
"gives": [
"baby_born"
],
"say": "You sat in the parking garage for four hours. You went up eventually. She didn’t ask where you’d been. She knew."
},
"fkit": {
"h": 26,
"s": -20,
"c": -60,
"n": -6,
"trust": {
"love": -4,
"pops": -3
},
"end": true,
"gives": [
"baby_born"
],
"say": "You went to the bar after. To celebrate. With a soda. The guy next to you bought you a shot. It sat there. You looked at it for a long time."
},
"date": {
"h": -6,
"s": -6,
"c": -150,
"n": 16,
"trust": {
"love": 5,
"mom": 3
},
"end": true,
"gives": [
"love_touch",
"baby_born"
],
"say": "Both moms. One room. They fought over the baby’s name and agreed on yours. “He stayed.” That’s what they said about you."
}
},
"expire": {
"h": 6,
"s": 20,
"c": 0,
"n": -6,
"trust": {
"love": -3,
"mom": -2
},
"say": "You missed it. You were at the lots. Her mom cut the cord. Jaz says it’s fine. Jaz says a lot of things are fine now."
},
"need": [
"pregnant",
"together",
"baby_due"
],
"once": true,
"weight": 4,
"late": false,
"girl": {
"setup": "Your water breaks at 3 AM in the kitchen. Marc has the bag by the door that you packed two weeks ago because you knew he wouldn’t. The car has a check engine light. Twenty-six hours later, somebody hands you a person. The nurse asks for your name for the bracelet. It takes you a second to say it like it belongs to a mother."
}
},
{
"id": "thanksgiving",
"ch": 5,
"scale": "month",
"title": "FIRST THANKSGIVING SOBER",
"who": "mom",
"setup": "Mom’s table. The whole family. Your uncle, who brings a cooler and an opinion. Your cousin, who “just wants to see if you’re really different.” Jaz on one side, Mom on the other, and a bottle of wine open in the middle of the table because nobody thought about it, because why would they. It’s the first holiday you’ve been invited to in six years.",
"now": 6,
"daily": 6,
"days": 2,
"moves": {
"meeting": {
"h": -12,
"s": -8,
"c": -20,
"n": 14,
"trust": {
"mom": 3,
"love": 2,
"pops": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "You hit the 9 AM gratitude meeting, then drove to Mom’s with a pie. Your uncle offered. You said “I’m good.” You were."
},
"call": {
"h": -10,
"s": -8,
"c": 0,
"n": 10,
"trust": {
"mom": 2,
"pops": 2,
"love": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "You sat in the driveway and called Pops. “Go in. Eat. Leave when you want. Call me from the driveway after.” You did both calls."
},
"help": {
"h": -8,
"s": -5,
"c": 0,
"n": 12,
"trust": {
"mom": 3
},
"end": true,
"gives": [],
"say": "You did every dish. Your uncle came in to “help,” stood there, and said “I’m proud of you” to the sink."
},
"rest": {
"h": -5,
"s": -8,
"c": 0,
"n": 6,
"trust": {
"mom": 2,
"love": 1
},
"end": true,
"gives": [
"love_touch"
],
"say": "You lasted till the pie, kissed Mom, and left. She said “thank you for coming.” She meant it."
},
"work": {
"h": 6,
"s": 10,
"c": 200,
"n": -2,
"trust": {
"darlene": 2,
"mom": -1,
"love": 1
},
"end": true,
"gives": [],
"say": "Darlene paid double. Mom set a plate anyway. Jaz brought you a plate at the dock at 9 PM."
},
"argue": {
"h": 14,
"s": -10,
"c": 0,
"n": -4,
"trust": {
"mom": -1
},
"end": true,
"gives": [],
"say": "Your uncle said rehab’s for the weak. You said some things. Mom said “not at my table.” You both shut up."
},
"ignore": {
"h": 6,
"s": -10,
"c": 0,
"n": -2,
"trust": {
"mom": 1,
"love": 1
},
"end": true,
"gives": [],
"say": "You sat on the porch all dinner. Jaz brought you a plate. Mom brought you a blanket. Nobody made you come in."
},
"fkit": {
"h": 28,
"s": -20,
"c": 0,
"n": -8,
"trust": {
"love": -2,
"pops": -2,
"mom": -1
},
"end": true,
"gives": [],
"say": "Your cousin poured. You picked it up. You looked at Jaz. You put it down. Your hand shook for an hour."
},
"crew": {
"h": 12,
"s": -18,
"c": -20,
"n": 0,
"trust": {
"ghost": 1,
"mom": -2
},
"end": true,
"gives": [],
"say": "You left Mom’s for the crew’s “Friendsgiving.” It was a party with a turkey. You left that one early too."
},
"date": {
"h": -8,
"s": -10,
"c": -20,
"n": 16,
"trust": {
"mom": 4,
"love": 3
},
"end": true,
"gives": [
"love_touch"
],
"say": "You brought Jaz. Nobody looked at the wine all night. Your uncle told her every story about you and cried at two of them."
}
},
"expire": {
"h": 8,
"s": 12,
"c": 0,
"n": -6,
"trust": {
"mom": -2,
"love": -1
},
"say": "You skipped it. Mom set a plate anyway. Jaz went without you and came home quiet."
},
"need": [],
"once": true,
"weight": 2,
"late": false
},
{
"id": "year_speaker",
"ch": 5,
"scale": "month",
"title": "THE ONE-YEAR MEETING",
"who": "pops",
"setup": "Pops, thin, out of the hospital for now, asks you to be the speaker at the Thursday meeting. Your one-year meeting. “Twenty minutes. Say what it was like, what happened, what it’s like now. Don’t make a speech.” Mom wants to come. Jaz wants to come. Dre wants to come. Big Ray says he might. You have never once talked for twenty minutes without lying.",
"now": 4,
"daily": 4,
"days": 2,
"moves": {
"meeting": {
"h": -14,
"s": -10,
"c": 0,
"n": 18,
"trust": {
"pops": 4,
"mom": 2,
"love": 2
},
"end": true,
"gives": [
"year_ready"
],
"say": "You said yes and sweated for a month. Then you stood up and told the truth for twenty-two minutes. Nobody checked their phone."
},
"call": {
"h": -10,
"s": -10,
"c": 0,
"n": 12,
"trust": {
"pops": 4
},
"end": true,
"gives": [
"year_ready"
],
"say": "You practiced on Pops every night for a month. He fell asleep twice. “That part’s boring. Cut it.” You cut it."
},
"help": {
"h": -8,
"s": -6,
"c": 0,
"n": 16,
"trust": {
"pops": 3,
"shorty": 2
},
"end": true,
"gives": [
"year_ready"
],
"say": "You asked Dre to introduce you. He wrote it on a napkin and read it with shaking hands. “This is my sponsor.” That was the whole intro."
},
"rest": {
"h": -5,
"s": -10,
"c": 0,
"n": 6,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"year_ready"
],
"say": "You wrote it out. Then Pops said “no notes.” You threw it away. You knew it anyway."
},
"work": {
"h": 6,
"s": 10,
"c": 0,
"n": 10,
"trust": {
"pops": 3
},
"end": true,
"gives": [
"year_ready"
],
"say": "You said yes and didn’t prepare. You stood up with nothing and said everything. It was the best one anybody’d heard in years."
},
"argue": {
"h": 4,
"s": -6,
"c": 0,
"n": 4,
"trust": {
"pops": 2
},
"end": true,
"gives": [
"year_ready"
],
"say": "You told Pops you’re not a speaker. He said “I know. That’s why I asked.” You said yes to shut him up."
},
"ignore": {
"h": 6,
"s": -8,
"c": 0,
"n": 2,
"trust": {
"pops": 1
},
"end": true,
"gives": [
"year_ready"
],
"say": "You said you’d think about it. Pops is sick. Thinking about it is not a thing you get to do anymore. You said yes a week later."
},
"fkit": {
"h": 18,
"s": -12,
"c": 0,
"n": -8,
"trust": {
"pops": -3
},
"end": true,
"gives": [],
"say": "You said ask Benny. Benny spoke. You sat in the back and felt it. Pops didn’t look at you once."
},
"date": {
"h": -6,
"s": -8,
"c": 0,
"n": 14,
"trust": {
"love": 3,
"pops": 3
},
"end": true,
"gives": [
"year_ready",
"love_touch"
],
"say": "You said yes because Jaz said she’d be in the front row. She was. She cried at the part about the shoes."
}
},
"expire": {
"h": 6,
"s": 10,
"c": 0,
"n": -4,
"trust": {
"pops": -2
},
"say": "You said you weren’t ready. Pops nodded. He asked Benny. Benny said yes."
},
"need": [
"year",
"sponsor"
],
"once": true,
"weight": 5,
"late": false
}
];
if (typeof module !== "undefined") module.exports = { SITUATIONS };
