#!/usr/bin/env python3
# Spiritual Gangster v7: chapter 3 (weeks), chapter 4 and 5 (months) situations, words and text threads.
# Writes them into sg-build/situations.js, words.js and convos.js (merging with what's there).
import json, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/sg-build/'

BASE = dict(meeting=(-12,-8,0,8), call=(-10,-10,0,7), help=(-8,-5,0,12), rest=(-5,-15,0,1), rides=(-10,-4,-8,12),
            work=(6,10,80,-2), betterjob=(5,8,-10,2), double=(8,18,0,-5), quit=(8,-20,0,-5),
            argue=(15,-12,0,-8), ignore=(12,-15,0,-12), fkit=(25,-25,-20,-15),
            crew=(4,-20,-15,6), ex=(3,-15,0,4), ghostlink=(8,-18,0,3), block=(8,-15,-5,5), bar=(6,-22,-25,6), party=(5,-25,-20,8),
            look=(0,-6,-60,2), date=(0,-8,-60,4), carfund=(0,-2,-100,0), movefund=(0,-2,-100,0), bizfund=(0,-2,-100,0))

def T(t):
    d = {}
    for m in re.finditer(r'(\w+)([+-]\d+)', t or ''): d[m.group(1)] = int(m.group(2))
    return d
def M(spec):
    """'word | say' or 'word | say | ends | trust | gives | h/s/c/n'  (later fields optional)"""
    p = [x.strip() for x in spec.split('|')]
    word, say = p[0], p[1]
    ends = len(p) > 2 and p[2].lower().startswith('end')
    trust = T(p[3]) if len(p) > 3 else {}
    gives = [g.strip() for g in p[4].split(',') if g.strip()] if len(p) > 4 and p[4] not in ('', '-') else []
    eff = [int(x) for x in re.findall(r'[+-]?\d+', p[5])] if len(p) > 5 else None
    return dict(word=word, say=say, end=ends, trust=trust, gives=gives, eff=eff)

SITS = []
def sit(id, ch, scale, who, title, setup, now, daily, days, expire, moves, thread, narr, need=None, once=False, weight=1, girl=None, late=False):
    SITS.append(dict(id=id, ch=ch, scale=scale, who=who, title=title, setup=setup, now=now, daily=daily, days=days,
                     expire=expire, moves={k: M(v) for k, v in moves.items()}, thread=thread, narr=narr, need=need or [], once=once, weight=weight, girl=girl, late=late))

# ---------------------------------------------------------------- CHAPTER 3: weeks at the sober house (30-90 days)
sit('trip_moves_in', 3, 'week', 'house', 'THE NEW GUY',
    'Big Ray moved a guy named Trip into the room next to yours. Forty, prison tats, a laugh that never reaches his eyes. By Tuesday your charger is gone, Shorty’s shoes are gone, and Trip is wearing them. Everybody in the house is scared of him except Big Ray, and Big Ray hasn’t noticed yet.',
    12, 8, 2, dict(h=10, s=12, c=-40, n=-4, trust=T('shorty-1'), say='You let it ride. Trip took forty bucks out of your jacket and dared you with his eyes to say something.'),
    dict(meeting='Meeting. Let Ray handle Trip | You took it to a meeting instead of to Trip’s face. An old-timer said “you don’t have to attend every fight you’re invited to.” You didn’t. Yet.',
         call='Ask Pops about Trip | Pops: “Is he your business? No. Is he gonna be? Probably. Tell Ray. Tonight. In front of people.”|| pops+1',
         help='Tell Big Ray, with Shorty | You and Shorty walked into Ray’s office together. Ray listened, then went and opened Trip’s locker. Shorty’s shoes were in it. Trip’s out by Friday. | ends | ray+2, shorty+2 | trip_out',
         rest='Lock my stuff up and sleep | You bought a padlock. Trip watched you put it on and smiled. You slept with your wallet in your sock.',
         work='Work. Stay out of the house | Six shifts. You were barely home. Trip was. So was your charger, until it wasn’t.',
         double='Doubles. Never be home | Twelve-hour days. You came home to sleep and left before Trip woke up. That’s not a plan. That’s hiding. || darlene+1',
         argue='Get in Trip’s face | You told Trip to give Shorty his shoes back. Trip laughed, took them off, and threw them at your chest. Ray came running. Trip’s gone. So is your jaw, for a day. | ends | shorty+2, ray+1 | trip_out | +18/-10/0/-4',
         ignore='Not my problem | You put your headphones in. Shorty walked around in socks for a week and stopped talking to you. | ends | shorty-3',
         fkit='Jump him in the lot | You caught Trip in the parking lot. Big Ray caught you. Both of you are out of the house tonight. | ends | ray-4, pops-2, ghost+2 | | +30/-20/-20/-15',
         crew='Have the crew scare him | The old crew came by and stood on the porch. Trip didn’t blink. Big Ray did. Now Ray thinks YOU brought the trouble. || ray-2, ghost+1',
         ghostlink='Ask Ghost to handle it | Ghost said “say less.” Trip moved out two days later with a fat lip. Now you owe Ghost, and Ghost always collects. | ends | ghost+3, pops-2 | trip_out, oldcontact',
         block='Lay low on the block | You spent the week on the old block instead of the house. Trip helped himself to your room while you were gone.',
         bar='Hide at the bar | You sat at the bar every night to avoid Trip. The bartender knows your soda order now. That’s a bad thing to be known for.',
         party='Party instead of going home | Four nights out. You came home to a stripped room and a note that said “thanks.”'),
    'SOBER HOUSE 🏠', 'A new guy named Trip moved in next to {N}. By Tuesday, half the house is missing something.',
    need=['soberhouse', 'notrip'], once=True)

sit('trip_knife', 3, 'week', 'shorty', 'TRIP PULLED A KNIFE',
    'Shorty’s whispering in the dark at 2 AM. Trip pulled a knife on him in the kitchen over the last of the milk. Then Trip told Shorty that if anybody says a word to Big Ray, the house is going to “have an accident.” Shorty wants to know what you’re going to do. Shorty is shaking.',
    18, 12, 2, dict(h=15, s=18, c=0, n=-6, trust=T('shorty-3'), say='You did nothing. Shorty moved to his cousin’s couch. Trip took Shorty’s bunk and your peace of mind.'),
    dict(meeting='Meeting. Pray on it | You sat in a meeting while Shorty sat alone with a man who pulled a knife on him. The coffee was good. Your conscience wasn’t.',
         call='Call Pops at 2 AM | Pops picked up on the second ring. “Call Ray now. Then call the police. Then call me back.” You did all three. Trip was gone by noon. | ends | pops+2, shorty+3, ray+1 | trip_out | -5/-5/0/+8',
         help='Walk Shorty to Ray’s door | You went with Shorty to Big Ray’s room at 2 AM. Ray came out in a robe with a baseball bat. Trip was on the porch with his trash bag by sunrise. | ends | shorty+3, ray+2 | trip_out | -2/-6/0/+10',
         rest='Sleep on it | You slept on it. Trip didn’t. He was in your doorway at 5 AM, just looking.',
         work='Work. Stay gone | You worked. Shorty didn’t sleep. Trip knows you know.',
         argue='Confront Trip in the kitchen | You told Trip the knife was going to be a problem. He showed it to you. Big Ray walked in on the end of it. Trip’s out. Ray’s not thrilled with you either. | ends | shorty+2, ray-1 | trip_out | +20/-8/0/-2',
         ignore='Tell Shorty to drop it | “Just stay out of the kitchen.” Shorty looked at you like you were somebody else. Maybe you were. | ends | shorty-4, pops-1',
         fkit='Get a knife of my own | You went to the pawn shop. Big Ray found it in a bunk check. House rule: weapons, you’re out. Shelter tonight. | ends | ray-5, pops-2 | | +28/-15/-30/-10',
         crew='Call the crew to the house | The crew rolled up deep. Trip saw them and left on his own. Big Ray saw them and wrote your name in the black book. | ends | ghost+1, ray-3, shorty+1 | trip_out',
         ghostlink='Let Ghost deal with Trip | Ghost said Trip owes him from county anyway. Trip disappeared. Nobody asked where. You stopped sleeping anyway. | ends | ghost+3, pops-3 | trip_out, oldcontact | +12/-10/0/0',
         bar='Drink a soda and think | You sat at the bar with a Coke and thought about knives. The bartender asked if you were okay. You said yes. You lied.'),
    'SHORTY', '2 AM. Shorty on the edge of {N}’s bunk, whispering. Trip has a knife.',
    need=['soberhouse', 'trip'], once=True, weight=3)

sit('insurance_and_flat', 3, 'week', 'mechanic', 'THE CAR HAS BILLS',
    'The car you were so proud of has a flat, a check engine light, and an insurance bill that came the same day as rent. The mechanic says $180 for the tire and “don’t ask about the light.” Shorty needs a ride to court Thursday. Pops needs one to the doctor Friday. Everybody needs you now that you have wheels.',
    8, 6, 2, dict(h=8, s=14, c=-120, n=-5, trust=T('shorty-1, pops-1'), say='You drove on the spare for a week until it blew on the highway. Tow truck: $120. Shorty missed court.'),
    dict(meeting='Meeting first, tire after | You hit the meeting and asked the room. A guy named Sal fixes tires out of his garage. $40 and a story about 1987. | ends | pops+1 | | -12/-8/-40/+10',
         call='Call Pops about the money | Pops: “Welcome to owning things. Things own you back.” He knows a guy. $90. | ends | pops+1 | | -10/-10/-90/+7',
         help='Give the rides anyway | You drove Shorty to court on the spare and Pops to the doctor on a prayer. Fixed the tire Saturday. Felt like a person. | ends | shorty+2, pops+2 | | -8/0/-180/+14',
         rides='Give rides, charge gas | You drove everybody and asked for gas money. Nobody minded. The tire got fixed off the tips. | ends | shorty+1, pops+1 | | -10/-4/-60/+12',
         rest='Park it. Take the bus | You parked the car for a week. Shorty took the bus to court. Pops missed the doctor. The light’s still on.',
         work='Work the week, fix it Saturday | Six shifts, then the tire. You missed Thursday and Friday for Shorty and Pops. The car works. Nobody called it fixed. | ends | | | 6/10/-180/-4',
         double='Doubles to cover the car | You pulled doubles to pay for the car you pulled doubles for. The light’s still on. So are you, barely. | ends | darlene+1, love-1 | | 8/18/-180/-6',
         argue='Argue with the mechanic | You told the mechanic he was a crook. He agreed and charged you anyway. | | | | +15/-12/-180/-6',
         ignore='Ignore the light and the people | You turned the radio up and told everybody you were busy. The car ran fine for exactly one week. | ends | shorty-2, pops-1',
         fkit='Sell the car to Ghost | Ghost gave you $300 for a car worth more. You walked home. You’re walking everywhere now. | ends | ghost+2, pops-2 | car_sold | +20/-20/+300/-8',
         bar='Hide out at the bar | You sat at the bar instead of under the car. The tire didn’t fix itself. The bartender didn’t charge you for the soda. He’s waiting.',
         carfund='Pay cash from the car stack | You emptied what was left in the car envelope. Tire fixed. The light stayed on. It always does. | ends | | | 0/-5/-180/0'),
    'MECHANIC', '{N}’s car has a flat, a light, and an insurance bill. Everybody needs a ride this week.',
    need=['car'])

sit('darlene_lead', 3, 'week', 'darlene', 'DARLENE’S CLIPBOARD',
    'Darlene calls you into the office. The lead on second shift walked out. She wants you to run the dock: $120 a shift, your own clipboard, and everybody’s problems. Catch: lead works the schedule Darlene posts, and Darlene posts meetings-night. “I need an answer by Friday. I need somebody who shows up.”',
    6, 5, 2, dict(h=6, s=10, c=0, n=-3, trust=T('darlene-2'), say='You never answered. Darlene gave it to a guy named Benny who’s been there two months. He wears the clipboard like a badge.'),
    dict(meeting='Ask the room first | You asked the meeting. Half said take it, half said don’t. Pops said “both halves are right.” Helpful. || pops+1',
         call='Ask Pops: lead or meetings? | Pops: “Take the job. Find a morning meeting. The program don’t care what time it is.” You took it. | ends | pops+1, darlene+2 | lead',
         help='Talk Benny into taking it | You found out Benny needs it more: custody case, lawyer bills. You told Darlene to give it to him. She looked at you different. | ends | darlene+2, shorty+1 | | -8/-5/0/+14',
         rest='Sleep on it till Friday | You slept on it. Friday came. You said yes with your eyes half open. | ends | darlene+1 | lead',
         work='Take the clipboard | $120 a shift. A radio on your hip. Six people who hate you by lunch. You’re lead. | ends | darlene+2 | lead',
         double='Take it AND the doubles | Lead on second, doubles on weekends. Darlene said “don’t burn out on me.” You said you don’t burn out. You have before. | ends | darlene+3, love-2, mom-1 | lead | 10/22/0/-6',
         quit='Walk before she can promote me | You quit instead of deciding. Freedom tasted like unemployment by Monday. | ends | darlene-5',
         argue='Tell Darlene the schedule is a joke | You told her meetings come first. She said “then you’re not lead.” Benny is. | ends | darlene-2, pops+1',
         ignore='Dodge her all week | You ducked the office all week. Friday she stopped asking. | ends | darlene-2',
         fkit='Tell her where to put the clipboard | Loud. In front of the dock. Benny is lead. You’re on the list. | ends | darlene-4, ray-1 | | +22/-20/0/-10',
         betterjob='Use it to get a better job | You told the temp agency you’d been offered lead. They had something better. Darlene heard. | ends | darlene-3 | | 5/8/-10/+4',
         date='Ask Jaz what she thinks | Jaz: “you’re asking ME? take the money, baby.” You took the money. | ends | love+2, darlene+1 | lead, love_touch | 0/-8/-60/+6'),
    'DARLENE', 'Darlene wants {N} to run the dock. $120 a shift. The schedule eats meeting night.',
    need=['job', 'nolead', 'nobiz'], once=True)

sit('jaz_cookout', 3, 'week', 'love', 'MEET THE FAMILY',
    'Jaz’s mom is having the cookout. The whole family. Her uncle who “doesn’t believe in rehab,” her cousin who sells pills, and a cooler the size of a casket. Jaz wants you there. “They need to see you’re real.” It’s the same Saturday as the speaker meeting Pops asked you to drive him to.',
    8, 6, 2, dict(h=8, s=14, c=0, n=-5, trust=T('love-3, pops-1'), say='You didn’t go to either. Jaz went alone and told her mom you had to work. Her mom said “mm-hm.”'),
    dict(meeting='Take Jaz to the speaker meeting | You brought Jaz to the speaker meeting instead. She cried at the end and squeezed your hand. “Okay. Now I get it.” Her mom is still mad. | ends | love+2, pops+2 | love_touch | -12/-8/0/+10',
         call='Call Pops for a plan | Pops: “Go to the cookout. Drink the pop. Leave at the first ‘one won’t hurt.’ I’ll get a ride.” You lasted till 7. | ends | love+2, pops+1 | love_touch | -8/-6/0/+8',
         help='Drive Pops, show up late | You drove Pops, then showed up at dusk with a pie. Jaz’s mom said “at least he brought something.” | ends | love+1, pops+2 | love_touch | -8/-5/-20/+12',
         rides='Pops first, cookout after | Pops to the meeting at noon, cookout by three, out by six. Everybody got a piece of you. | ends | love+1, pops+2 | love_touch | -10/-4/-15/+12',
         rest='Skip both. Sleep | You said you were sick. Jaz said “of what?” You didn’t have an answer.',
         work='Work Saturday instead | Darlene needed the hands. Jaz needed you. Darlene pays better. Jaz remembers longer. || darlene+1, love-2',
         argue='Tell Jaz her family is a trigger | You said her family is a bad place for you. True. You said it like an accusation. Not true. | ends | love-3',
         ignore='Leave Jaz on read till Sunday | Saturday came and went. Sunday you texted “my bad.” She left YOU on read. | ends | love-4',
         fkit='Go and sit by the cooler | You went. You sat by the cooler. Her cousin offered. You said no the first three times. | ends | love-2, pops-3, ghost+1 | | +22/-25/0/-5',
         bar='Meet Jaz at the bar after | You skipped the cookout and met her at a bar after. She was already annoyed. The bar didn’t help. | ends | love-2 | | +8/-18/-30/+3',
         party='Cookout is a party, right? | You treated it like a party. Her uncle treated you like a punchline. Jaz drove you home early. | ends | love-2 | | +6/-20/-20/+4',
         look='Show up fresh | New fit, fresh cut, a store-bought pie. Her mom said “he clean up alright.” Jaz said “told you.” | ends | love+3, mom+1 | love_touch | 0/-6/-80/+6',
         date='Take Jaz, leave early together | You went. Two hours. Then you took her to dinner, just you two. She said that was the best part. | ends | love+3 | love_touch | 0/-10/-70/+8'),
    'JAZ', 'The cookout. Jaz’s whole family, a cooler full of beer, and Pops needing a ride the same day. {N} can’t be two places.',
    need=['together'], once=True)

sit('dre_first_meeting', 3, 'week', 'newcomer', 'DRE’S FIRST MEETING',
    'Dre, the new kid, has been at the house two weeks and hasn’t been to a meeting. Big Ray’s about to put him out for it. Dre asked you, not Shorty, not Pops, YOU, to take him. “You the only one here who don’t look at me like I already failed.” He’s scared of the room.',
    6, 5, 2, dict(h=6, s=8, c=0, n=-6, trust=T('pops-1'), say='You didn’t take him. Big Ray put Dre out Sunday. He left his trash bag on the porch. Nobody knows where he went.'),
    dict(meeting='Take Dre with me | You walked in together. Dre sat on his hands the whole hour and said “thanks” twice in the car. He went back Tuesday on his own. | ends | pops+2, shorty+1, ray+1 | dre_in | -12/-10/0/+14',
         call='Ask Pops to take him | Pops took him. Dre came back quiet. “Pops said you told him to. Thanks for not making it a thing.” | ends | pops+1 | dre_in | -10/-10/0/+8',
         help='Go early, save him a seat | You went early and saved two seats. He almost didn’t come in. Then he did. | ends | pops+2, shorty+1 | dre_in | -8/-5/0/+14',
         rides='Drive him every night this week | Five nights. Five meetings. By Friday Dre was talking to people in the parking lot. | ends | pops+2, shorty+1 | dre_in | -10/-4/-15/+14',
         rest='Tell him next week | You said next week. Big Ray said Sunday. Dre’s gone.',
         work='Work. Somebody else will | You worked. Nobody else did. Big Ray did what Big Ray does. || ray-1',
         argue='Tell Ray to back off Dre | You told Big Ray to give the kid a minute. Ray said “minutes cost $100 a week.” He gave him one more week anyway. || ray-1',
         ignore='Not my kid | You said you had enough on your plate. Dre nodded like he expected it. | ends | shorty-2',
         fkit='Tell Dre meetings are a scam | You told him the whole thing’s a scam and the house is a racket. He believed you. He was gone in three days, with Ghost. | ends | pops-3, ghost+2 | | +20/-20/0/-10',
         crew='Bring Dre to the crew instead | You showed Dre the old crew. He fit right in. That’s the worst part. | ends | ghost+2, pops-2 | | +10/-18/-15/+2',
         block='Walk the block with him | You took Dre around the old block to “show him what not to do.” He got three phone numbers.'),
    'DRE', 'Dre’s been at the house two weeks. No meetings. Big Ray’s counting. Dre asked {N} to take him.',
    once=True)

sit('mom_amends', 3, 'week', 'mom', 'THE AMENDS',
    'Pops says it’s time. Mom. Not a sorry: a list. The money, the lies, the night with the police in her kitchen. She said she’d see you Sunday. She also said “don’t make a speech.” You’ve had thirty days to think about what you did. She’s had years.',
    6, 4, 3, dict(h=6, s=16, c=0, n=-4, trust=T('mom-2, pops-1'), say='You kept putting Sunday off. Mom stopped asking if you were coming. That’s its own kind of answer.'),
    dict(meeting='Meeting, then Mom’s | You went to a meeting first and said it out loud to strangers. Then you said it to her. She didn’t say “it’s okay.” She said “thank you for saying it.” | ends | mom+3, pops+2 | | -12/-10/0/+12',
         call='Practice it with Pops | You read it to Pops first. He crossed out half. “That’s you feeling better. This half is for her.” Sunday went better than it should have. | ends | mom+3, pops+2 | | -10/-10/0/+10',
         help='Fix her porch step first | You fixed the step she’s been asking about for three years, then sat down and told her. She listened with a hand on your back. | ends | mom+4 | | -8/-5/-30/+14',
         rest='Write it down. Sit with it | You wrote four pages. Threw out three. Sunday’s still coming.',
         work='Work Sunday. Postpone | You picked up a shift. Mom said “of course.” It wasn’t mean. It was tired. || mom-1, darlene+1',
         argue='Tell her she wasn’t perfect either | Halfway through, you brought up her stuff. The step work says you don’t. You did. She got up and did the dishes. | ends | mom-3, pops-2',
         ignore='Text it instead | You sent a long text. She replied “ok.” Two letters. | ends | mom-1',
         fkit='Skip it. She knows | You didn’t go. You hit the bar after work “just for the game.” Mom heard. She always hears. | ends | mom-3, pops-2 | | +22/-20/-25/-8',
         ex='Ask the ex to come | You brought the ex for backup. Mom took one look and said “really?” Nobody ate. | ends | mom-2, love-3',
         date='Bring Jaz | You brought Jaz. Mom held her hand through the hard part and kept holding it after. “This one,” Mom said. | ends | mom+3, love+2 | love_touch | -5/-8/-20/+10',
         look='Show up looking like a son | New shirt, clean shoes, a haircut. She noticed before you said a word. Then you said the words. | ends | mom+3 | | 0/-6/-60/+8'),
    'MOM', 'Sunday. The amends. Mom said “don’t make a speech.” {N} has a list.',
    once=True)

sit('ghost_collects', 3, 'week', 'ghost', 'GHOST’S INVOICE',
    'Ghost texts a number: $400. “From back when. I let it ride ’cause you was sick. You got a job now.” You don’t remember owing it. You don’t remember a lot of back then. He’s parked outside the warehouse at quitting time, engine running, friendly as hell.',
    16, 12, 2, dict(h=18, s=15, c=-200, n=-5, trust=T('ghost+2'), say='You stalled. Ghost took $200 off you in the parking lot “as a down payment” and smiled the whole time.'),
    dict(meeting='Meeting. Say it out loud | You said it in the meeting: a dealer says I owe him. Three guys stayed after. “You don’t owe a dealer. You owe the people you robbed to pay him.” | ends | pops+2, ghost-2 | | -14/-8/0/+10',
         call='Call Pops about Ghost | Pops: “You pay that, you’re buying. Block him. If he comes to the house, Ray handles it.” You blocked him. He came by once. Ray handled it. | ends | pops+2, ray+1, ghost-3 | | -10/-10/0/+6',
         help='Ask Darlene for the back door | You told Darlene a guy was waiting on you. She walked you out the loading dock side for a week and never asked why. | ends | darlene+2, ghost-1 | | -6/-5/0/+8',
         rest='Lay low at the house | You went straight home all week. Ghost texted a picture of the house. “Nice porch.”',
         work='Pay him with a week’s wages | You handed Ghost $400 in the lot. He said “see, that wasn’t hard.” He’ll be back for the rest of what you don’t owe. | ends | ghost+3, pops-2 | | 8/-10/-400/-2',
         argue='Tell him I don’t owe him | You told him in the lot, loud. He laughed. “Okay. Okay. We’ll see.” He’s still parked there. || ghost+1 | | +15/-12/0/-6',
         ignore='Block him | You blocked the number. He got a new one. You blocked that. Three numbers in, he stopped. For now. | ends | ghost-2',
         fkit='Pay him in trade | He said you could work it off. One ride. One package. You didn’t open it. You know what was in it. | ends | ghost+4, pops-3 | oldcontact | +35/-25/+100/-10',
         crew='Ask the crew if it’s real | The crew said yeah, you owed him, and some of them too. Now everybody’s got an invoice. | ends | ghost+2 | | +8/-15/-100/+4',
         ghostlink='Sit in his car and talk it out | You got in the car “to talk.” $150 and a favor you’ll hear about later. | ends | ghost+3, pops-2 | oldcontact | +14/-18/-150/0',
         block='Ask around the block | The block said Ghost does this to everybody who gets clean. Tax on getting better. | ends | ghost-1 | | +6/-10/-5/+5'),
    'GHOST', 'Ghost says {N} owes him $400 from back when. He’s parked outside the warehouse. Friendly as hell.',
    weight=2)

sit('shorty_relapse', 3, 'week', 'shorty', 'SHORTY WENT OUT',
    'Shorty didn’t come home Tuesday. Wednesday either. His phone goes to voicemail. Thursday he texts you from a number you don’t know: “im ok dont tell ray.” You know the block he’s on. You know the house. You know exactly what’s in it.',
    14, 10, 2, dict(h=12, s=18, c=0, n=-8, trust=T('shorty-2, ray-1'), say='You waited. Big Ray found out Friday and boxed Shorty’s stuff. Shorty came home to a locked door.'),
    dict(meeting='Meeting. Ask for help finding him | You said it in the meeting. Four guys went with you, in two cars, in daylight. Shorty came out on his own when he saw Pops. | ends | shorty+3, pops+2 | | -10/-6/0/+14',
         call='Call Pops. Don’t go alone | Pops: “You don’t go in that house. You call Ray, you call me, we go together.” Three of you. Shorty cried in the back seat. | ends | shorty+3, pops+2, ray+1 | | -8/-8/0/+12',
         help='Go get him. Daylight. Pops in the car | You went at noon with Pops in the passenger seat and the engine running. Two minutes. Shorty came out. | ends | shorty+4, pops+2 | | -5/-5/0/+14',
         rides='Drive by every day till he comes out | You drove past every day and honked. Day three he got in. Day four he detoxed on your floor. | ends | shorty+3 | | -6/-2/-20/+12',
         rest='Give him space | You gave him space. The house gave him a locked door. || shorty-1',
         work='Work. Tell Ray the truth | You told Big Ray straight. Ray went himself. Shorty’s back on probation with the house. He’s alive. | ends | ray+2, shorty+1 | | 6/10/0/0',
         argue='Yell at him over the phone | You yelled. He hung up. The new number stopped answering. || shorty-2',
         ignore='He said don’t tell Ray | You kept his secret for a week. Ray found out anyway. Now you’re both in the black book. | ends | ray-3, shorty-1',
         fkit='Go in alone | You went in alone at night. You found him. You also found the table. You sat down for a minute. Just a minute. | ends | shorty+1, ghost+2, pops-2 | | +30/-20/-40/-5',
         ghostlink='Ask Ghost where he is | Ghost knew. Of course Ghost knew. “Tell Shorty his tab’s open.” | ends | ghost+2, shorty+1 | oldcontact | +14/-10/0/+2',
         block='Walk the block and look | You walked the block asking. Everybody knew where. Nobody wanted to say. Three days later he walked up to you on that same corner. | ends | shorty+2 | | +10/-10/-5/+6'),
    'SHORTY', 'Shorty’s been gone three days. Texted from a strange number: “dont tell ray.” {N} knows the house.',
    weight=2)

# ---------------------------------------------------------------- CHAPTER 4: months, your own place (90-180 days)
sit('lights_notice', 4, 'month', 'landlord', 'THE PINK NOTICE',
    'Your own place. Your own door. Your own pink notice from the electric company. Rent took everything, the car took the rest, and the lights are $140 behind. The landlord texts: “FYI utilities are in your name. Not mine. Not my problem.” It is the first of the month and you have $60.',
    6, 5, 2, dict(h=8, s=18, c=0, n=-4, trust={}, say='The lights went off on the 14th. You charged your phone at the gas station for two weeks like it was day one.'),
    dict(meeting='Meeting. Ask about the assistance office | A woman at the meeting works at the county. There’s a program. Forms, a wait, and the lights stayed on. | ends | | | -12/-8/-40/+10',
         call='Call Pops. Borrow $140 | Pops gave you $140 and a lecture about budgets. “Pay me back $20 a week. In person.” You did. | ends | pops+1 | | -10/-10/0/+6',
         help='Pick up side work for a neighbor | The old guy across the hall needed his yard cleared. $150 cash and a lead on two more. | ends | | bizseed | -6/0/+150/+10',
         rest='Candles and a budget | You sat in the dark with a notebook and did math for the first time since school. It didn’t fix the bill. It fixed the next one. | ends | | | -5/-10/0/0',
         work='Work the month. Pay late | You worked. Paid on the 20th with the late fee. Lights stayed on. Barely. | ends | | | 6/10/-180/-2',
         double='Doubles till it’s paid | Two weeks of doubles. Paid in full on the 10th. You didn’t see daylight or Jaz. | ends | darlene+1, love-2 | | 8/18/-140/-6',
         quit='Quit and move back to Ray’s | You gave up the place and went back to the sober house. Big Ray didn’t even look surprised. | ends | ray+1, mom-2 | moved_back | 10/-15/0/-6',
         argue='Argue with the electric company | Forty minutes on hold, ten minutes yelling. They put a note in your file. The note was not helpful. || | | +12/-8/0/-2',
         ignore='Ignore the pink paper | You ignored it. Pink turned red. Red turned dark. | ends | | | +10/-10/0/-6',
         fkit='Pawn the TV and go out | Pawned the TV, paid the light bill, blew the rest at the bar celebrating lights. | ends | pops-1 | | +18/-20/+60/-4',
         crew='Borrow from the crew | The crew fronted you $140 and a “we got you.” Now you’re in the crew’s book. | ends | ghost+1 | | +8/-12/+140/+4',
         ghostlink='Ask Ghost for a loan | Ghost paid your light bill directly. Online. From his phone. Now he has your account number. | ends | ghost+3, pops-2 | oldcontact | +14/-15/+140/0',
         bizfund='Start the side hustle | You bought a used mower with the stack money and knocked on doors. Six yards. $200. The lights stayed on. | ends | | bizseed | 0/-4/+200/+6'),
    'LANDLORD', '{N}’s first month in {his} own place. Rent, the car, and a pink notice from the electric company.',
    need=['ownplace'], once=True, weight=2)

sit('dre_asks', 4, 'month', 'newcomer', 'DRE WANTS A SPONSOR',
    'Dre has sixty days. He waited for you after the meeting, hands in his pockets, and asked you to sponsor him. You, with barely a hundred days. Pops is standing by the coffee pot pretending not to listen. Dre has a court date, a kid he’s not allowed to see, and a mother who stopped picking up. He needs somebody. He picked you.',
    4, 4, 2, dict(h=6, s=10, c=0, n=-6, trust=T('pops-1'), say='You never gave him an answer. Dre asked a guy with a nicer car instead. That guy relapsed in March and took Dre with him.'),
    dict(meeting='Say yes in the room | You said yes right there. Pops nodded once. Dre calls at 10 PM every night now. You pick up every time. | ends | pops+2, shorty+1 | sponsee | -12/-6/0/+14',
         call='Ask Pops if I’m ready | Pops: “Nobody’s ready. You got a phone and a year of mistakes. That’s the job.” You said yes. | ends | pops+2 | sponsee | -10/-8/0/+10',
         help='Co-sponsor with Pops | You told Dre you’d do it together with Pops. Three-way calls. Pops does the big book, you do the 2 AM. | ends | pops+2 | sponsee | -8/-5/0/+12',
         rest='Tell him I need a week | You said give me a week. He gave you two. You said yes on a Tuesday in the rain. | ends | | sponsee | -5/-10/0/+6',
         work='Tell him work’s too much right now | You said you can’t right now. True. He said “it’s cool.” Not true. || pops-1',
         argue='Tell him Pops is better | You pushed him to Pops. Pops took him. Pops also said “he asked YOU.” | ends | pops+1 | | +4/-6/0/-2',
         ignore='Dodge him for a month | You dodged him at every meeting. He stopped coming to that one. | ends | pops-2, shorty-1 | | +10/-10/0/-8',
         fkit='Tell him I’m barely sober myself | “I can’t even keep my own lights on.” Dre laughed. Then he went and found somebody else. Somebody worse. | ends | pops-2, ghost+1 | | +15/-18/0/-8',
         date='Ask Jaz if I have the time | Jaz: “you make time for the bar, you can make time for a kid who’s trying.” She wasn’t wrong. | ends | love+2, pops+1 | sponsee, love_touch | 0/-8/-60/+8'),
    'DRE', 'Dre, sixty days, asked {N} to sponsor him. Pops is pretending not to listen.',
    need=['sponsor', 'nosponsee'], once=True, weight=2)

sit('jaz_pregnant', 3, 'week', 'love', 'WE NEED TO TALK',
    'Jaz texts “we need to talk” and then nothing for four hours. She comes over with a bag from the pharmacy and sits on the couch you got off the curb. Two lines. She’s crying and laughing at the same time. You have $300, a hundred and twenty days, and a car with a check engine light. She’s looking at you like whatever you say next is going to matter for the rest of your life.',
    10, 8, 2, dict(h=10, s=22, c=0, n=-8, trust=T('love-4, mom-1'), say='You said nothing for a week. She stopped waiting for you to say something. Her mom’s doing the doctor visits now.'),
    dict(meeting='Meeting, then back to her couch | You went to a meeting and said it out loud. Then you went back and said the only thing that mattered: “I’m here. I’m not going anywhere.” | ends | love+4, pops+2 | pregnant, love_touch | -10/-6/0/+14',
         call='Call Pops first | Pops: “You scared?” Yes. “Good. Scared men show up. Go back in there.” You did. | ends | love+3, pops+2 | pregnant, love_touch | -8/-8/0/+10',
         help='Go to the first appointment | You drove her to the first appointment and held the clipboard. The nurse called you “Dad.” You almost dropped it. | ends | love+4, mom+1 | pregnant, love_touch | -6/-4/-40/+14',
         rest='Sit with her all night and say nothing | You didn’t say anything. You stayed. By morning that was the answer. | ends | love+2 | pregnant, love_touch | -5/-10/0/+6',
         work='Work a double. Start saving now | You pulled a double the next day. She understood. Sort of. Money’s a kind of showing up. Not the only kind. | ends | love+1, darlene+1 | pregnant | 8/14/0/-2',
         argue='Ask if it’s even mine | You asked. Out loud. She left. She came back a week later because she had nowhere else to go. Not because of you. | ends | love-5 | pregnant | +18/-10/0/-10',
         ignore='Leave for a drive | You said you needed air. You drove for three hours. She was gone when you got back. | ends | love-4, mom-2 | pregnant | +14/-12/-20/-10',
         fkit='Go to the bar and think | You thought at the bar. Six sodas. The bartender asked if you were celebrating. You didn’t know. | ends | love-3, pops-3 | pregnant | +25/-20/-30/-8',
         ex='Text the ex for advice | You texted the ex. Jaz saw the phone. There is no coming back from the ex’s name on your screen that night. | ends | love-6 | pregnant | +10/-10/0/-8',
         date='Tell Mom together | You drove Jaz to Mom’s and said it together at the kitchen table. Mom cried, then started making a list. | ends | love+4, mom+3 | pregnant, love_touch | -4/-8/-40/+14',
         look='Buy the crib before the test is dry | You bought a crib that night. Jaz said “you’re insane.” She was smiling. | ends | love+3 | pregnant, love_touch | 0/-8/-200/+8'),
    'JAZ', 'Jaz: “we need to talk.” A bag from the pharmacy. Two lines. {N} has $300 and a check engine light.',
    need=['together', 'notpregnant', 'sober45'], once=True, weight=3, late=True,
    girl=dict(setup='You’ve been sick for a week and blaming the warehouse. Marc brought the bag from the pharmacy without being asked. Two lines. You’re sitting on the couch you got off the curb, crying and laughing at the same time. You have $300, a hundred and twenty days, and a car with a check engine light. Marc is looking at you like whatever you say next is going to matter for the rest of your life.',
              narr='Two lines. Marc brought the test. {N} has $300 and a check engine light.',
              thread='MARC'))

sit('ex_amends', 4, 'month', 'ex', 'THE EX WANTS TO TALK',
    'The ex calls from a number you don’t have blocked. Not 3 AM this time. Noon. Sober voice. “I’m in a program too now. I owe you an amends. Can we meet?” You owe one back. You also know how it ends every time you two are in a room. Pops says amends don’t require a reunion.',
    8, 6, 2, dict(h=8, s=10, c=0, n=-3, trust=T('love-1'), say='You never called back. The ex left a long voicemail you listened to twice and deleted once.'),
    dict(meeting='Meet at a meeting. Public | You said “meet me at the Thursday meeting.” Public, bright, Pops in the room. Two amends, one hug, no number exchanged. | ends | pops+2, love+1 | | -12/-8/0/+10',
         call='Ask Pops how to do it | Pops: “Coffee shop. Daytime. Thirty minutes. Say yours, hear theirs, leave.” You followed it to the minute. | ends | pops+2 | | -10/-8/-10/+8',
         help='Write it, send it, don’t meet | You wrote your amends and mailed it. A letter. The ex sent one back. That was enough. | ends | pops+1, love+1 | | -8/-5/-5/+6',
         rest='Not now. Maybe never | You said not yet. Pops said that’s allowed. The ex said “okay” like it was a door closing. | ends | | | -5/-10/0/-2',
         work='Say I’m too busy with work | You hid behind the schedule. The ex saw through it. So did you. || love+1',
         argue='Tell the ex what they did to me | You met and spent the whole hour on their list instead of yours. The ex cried. You felt like garbage, correctly. | ends | pops-2 | | +12/-10/0/-6',
         ignore='Block the new number | Blocked. Again. It felt like strength. Pops said it looked like fear. | ends | | | +6/-8/0/-4',
         fkit='Meet at the old spot | The old bar. Just talking. Then the ex’s hand on your arm. You left at midnight, sober and sick about it. Jaz saw the time stamp. | ends | love-5, pops-2 | | +25/-20/-30/-6',
         ex='Go to their place to “talk” | You went to the apartment. Nothing good happens at the ex’s apartment. Nothing good did. | ends | love-6, pops-3 | | +22/-22/0/-8',
         date='Tell Jaz first, then meet | You told Jaz before you went. She said “okay. text me when you leave.” You texted at 1:34 PM: “done. love you.” | ends | love+3, pops+1 | love_touch | -4/-6/-20/+10'),
    'THE EX', 'The ex. Noon this time. Sober voice. “I owe you an amends.” {N} owes one back.',
    once=True)

sit('dre_court', 4, 'month', 'newcomer', 'DRE’S COURT DATE',
    'Dre’s court date is the 15th at 9 AM. Downtown. He has no car and no suit. If he misses it there’s a warrant. The 15th is also the day the property manager wants to meet about the lots, the day Darlene’s doing the quarterly, and Jaz’s ultrasound is at 10:30. You’re his sponsor. You have one body.',
    8, 6, 2, dict(h=10, s=16, c=0, n=-6, trust=T('pops-2'), say='Dre missed court. There’s a warrant. He’s back at the house, scared to leave it. You told yourself it wasn’t your job.'),
    dict(meeting='Ask the meeting for a driver | You asked the room. Sal drove Dre in a suit from the church closet. You made the ultrasound. | ends | pops+2, love+1 | | -10/-6/0/+12',
         call='Call Pops to take him | Pops took Dre to court in Pops’ Buick and his own funeral suit. Judge gave Dre probation. Pops gave Dre a lecture. | ends | pops+1 | | -10/-8/0/+8',
         help='Drive Dre. Miss the rest | You drove Dre downtown at 8, sat in the back row, and watched a judge give the kid a second chance. Jaz went to the ultrasound with her mom. | ends | pops+3, shorty+1, love-1, darlene-1 | | -8/-4/-20/+14',
         rides='Drive Dre at 9, run to Jaz by 10:30 | You did both. Barely. Speeding. Dre got probation, Jaz got a picture, you got a ticket. | ends | pops+2, love+2 | love_touch | -8/0/-120/+14',
         rest='Tell Dre to take the bus | You told him the bus. He missed the transfer. Warrant. || pops-2',
         work='Work. Darlene’s quarterly | You chose the quarterly. Darlene noticed. So did the judge, in a way: Dre showed up alone and got the max. | ends | darlene+2, pops-2 | | 6/12/0/-6',
         double='Doubles. Pay for Dre’s lawyer | You couldn’t be there, so you paid for a real lawyer with double money. Dre got probation. He still wanted you in the room. | ends | pops+1, darlene+1, love-1 | | 8/18/-400/-2',
         argue='Tell Dre it’s not my job | You said a sponsor isn’t a chauffeur. True in the book. Dre heard “you’re on your own.” | ends | pops-2 | | +12/-8/0/-8',
         ignore='Forget the date | You forgot. He didn’t. Warrant. | ends | pops-3, shorty-1 | | +14/-10/0/-10',
         fkit='Tell him to skip it | “Warrants don’t mean nothing.” He skipped it. Warrants mean something. | ends | pops-3, ghost+1 | | +22/-15/0/-10',
         date='Ultrasound first, then court | You went to the ultrasound at 8 (they moved it), then flew downtown. Dre was on the steps, waiting. You walked in together. | ends | love+3, pops+2 | love_touch | -6/-6/-30/+14'),
    'DRE', 'The 15th. Dre’s court date, Jaz’s ultrasound, Darlene’s quarterly, the property manager. {N} has one body.',
    need=['sponsee'], once=True, weight=2)

sit('first_client', 4, 'month', 'client', 'THE LADY WITH THE LOTS',
    'Ms. Patel manages six rental properties and watched you clear your neighbor’s yard from her car. She wants a quote for all six, every two weeks, through October. It’s real money: $900 a month. It’s also a truck you don’t have, a mower that starts on the third pull, and a lot of Saturdays. “I need somebody who shows up,” she says. Everybody keeps saying that.',
    4, 4, 2, dict(h=6, s=8, c=0, n=-3, trust={}, say='You never sent the quote. Ms. Patel hired a company with a logo. You drive past their trucks every day.'),
    dict(meeting='Ask the room for a truck | You asked the meeting. Sal has a truck he doesn’t use. $50 a weekend. You sent the quote. She said yes. | ends | pops+1 | bizseed | -10/-6/-50/+10',
         call='Ask Pops if I can do this | Pops: “Can you push a mower? Can you show up? Then you can run a business. Everything else is paperwork.” | ends | pops+2 | bizseed | -8/-8/0/+8',
         help='Bring Dre on as help | You hired Dre for $15 an hour. He showed up early. You sent the quote. She said yes. | ends | pops+2, shorty+1 | bizseed | -6/-2/-60/+12',
         rest='Think about it | You thought about it for three weeks. She hired a company with a logo. || | | -5/-12/0/-2',
         work='Keep the day job. Say no | You said no. Safe. Darlene was glad. You still look at the lots when you drive past. | ends | darlene+1 | | 6/4/0/-2',
         double='Do both. Doubles AND the lots | Warehouse all week, lots all weekend. $900 extra a month. You slept in the truck once. | ends | darlene+1, love-2, mom-1 | bizseed | 10/22/+900/-4',
         quit='Quit the warehouse. All in | You quit Darlene and went all in on six lots and a mower. Month one was terrifying. Month two was $900. | ends | darlene-3, pops+1 | bizseed | 12/-10/+400/+2',
         argue='Quote her too high | You quoted $1,500 a month out of fear. She said “no thank you” nicely. Nicely is worse. | ends | | | +8/-8/0/-4',
         ignore='Don’t send the quote | You didn’t send it. Logos. Trucks. Every day. | ends | | | +6/-6/0/-4',
         fkit='Take the deposit and ghost her | You took a $300 deposit, did one lot, and stopped answering. She told everybody. | ends | pops-2, ghost+1 | | +20/-15/+300/-12',
         bizfund='Buy the truck. Send the quote | You emptied the stack on a used truck and a mower that starts first pull. Quote sent. “When can you start?” | ends | pops+1 | bizseed | 0/-6/0/+8',
         date='Ask Jaz to do the paperwork | Jaz did the quote on her laptop in twenty minutes with a logo and everything. “You’re welcome. I get ten percent.” | ends | love+2 | bizseed, love_touch | 0/-8/-30/+8'),
    'MS. PATEL', 'Ms. Patel. Six properties. $900 a month. {N} has a mower that starts on the third pull.',
    need=['nobiz', 'ownplace'], once=True, weight=2)

sit('warrant_check', 4, 'month', 'unknown', 'THE OLD WARRANT',
    'A letter from a county you haven’t been to in years. A bench warrant from a case you walked away from before you got sober. Failure to appear. Pops says you handle it: show up, turn yourself in, take the hit. The lawyer on the bus ad says $500 to make it go away. Ghost says just don’t drive through that county.',
    14, 10, 3, dict(h=20, s=15, c=0, n=-4, trust={}, say='You did nothing. A traffic stop in March ran your name. The old county had a surprise waiting.'),
    dict(meeting='Meeting. Then the courthouse | You went to a meeting, then walked into the courthouse with Pops. Two hours, a fine, a date. Done. The judge said “good luck.” | ends | pops+2 | | -16/-10/-150/+10',
         call='Call Pops. Go together | Pops drove you. You turned yourself in at 8 AM with a coffee in your hand. Processed and out by noon. A fine. A clean name. | ends | pops+2 | | -14/-10/-150/+8',
         help='Ask the public defender office | You called the public defender. A kid in a bad suit got it reduced to a fine over the phone. | ends | | | -10/-6/-100/+4',
         rest='Hide out and think | You stayed in the apartment for a week. The warrant stayed in the system.',
         work='Pay the bus-ad lawyer | $500 to the lawyer on the bus. He made one call. It worked. You’re broke and clean. | ends | | | -8/-8/-500/0',
         double='Doubles to pay the lawyer | You doubled for two weeks and paid the lawyer. Jaz asked if you were avoiding her. You were avoiding a warrant. | ends | love-1, darlene+1 | | -6/10/-500/-4',
         argue='Call the clerk and argue | You argued with a clerk for an hour. She added a note to your file. Clerks always win. || | | +12/-8/0/-2',
         ignore='Just don’t drive through there | You avoided the county. Then you drove through it to get Dre’s mom to a funeral. The stop took four hours. | ends | | | +20/-6/-300/-6',
         fkit='Tear it up | You tore up the letter. They have copies. | ends | ghost+1 | | +22/-18/0/-6',
         ghostlink='Ask Ghost for the trick | Ghost: “Just don’t go there, and don’t get pulled over.” That’s not a trick. That’s a countdown. | ends | ghost+2, pops-2 | oldcontact | +14/-12/0/0',
         block='Ask the block who to call | The block knew a guy who knew a guy. The guy took $200 and vanished. | ends | | | +10/-8/-200/+2'),
    'UNKNOWN', 'A bench warrant from a county {N} hasn’t been to in years. Pops says turn yourself in. Ghost says just don’t drive there.',
    once=True)

# ---------------------------------------------------------------- CHAPTER 5: giving it back (180-365 days)
sit('pops_diagnosis', 5, 'month', 'pops', 'POPS IS SICK',
    'Pops didn’t make the Thursday meeting. Pops always makes the Thursday meeting. He calls you from a hospital bed like it’s nothing. “It’s the pancreas. They’re gonna try some things.” He’s got nobody. Twenty-four years sober, a hundred sponsees, and nobody on the emergency contact line. He asks if you’d mind being on it.',
    6, 6, 2, dict(h=8, s=20, c=0, n=-6, trust=T('pops-3'), say='You said you’d visit and kept not visiting. Pops stopped mentioning it. Pops never mentions anything twice.'),
    dict(meeting='Take the meeting to his room | You brought the Thursday meeting to the hospital. Eleven folding chairs in a room built for two. The nurses let it slide. | ends | pops+4, shorty+1 | pops_sick | -14/-10/0/+16',
         call='Be the emergency contact | You said yes. Then you learned what it means: forms, 3 AM calls, a doctor who talks to you like family. You are, apparently. | ends | pops+4 | pops_sick | -10/-12/0/+12',
         help='Sit with him every night | Every night after work. He pretended to hate it. He asked what time you were coming the next day. | ends | pops+4, mom+1 | pops_sick | -8/-8/-40/+14',
         rides='Drive him to every appointment | Chemo Tuesdays. Scans Fridays. You know the hospital parking garage better than your own street. | ends | pops+4 | pops_sick | -10/-6/-60/+14',
         rest='Visit once. It’s hard to see him | You went once. He looked small. You didn’t go back for two weeks. He noticed. | ends | pops+1 | pops_sick | -5/-10/0/+2',
         work='Work. Visit on weekends | You worked all week and sat with him Saturdays. He said that was plenty. He was lying to make it easy on you. | ends | pops+2, darlene+1 | pops_sick | 6/10/0/+4',
         double='Doubles. Help with his bills | You paid his copays with double money. He found out and yelled. Then he cried. Then he yelled again. | ends | pops+3, love-1 | pops_sick | 8/16/-300/+6',
         argue='Tell him to fight harder | You told him to fight. He said “son, I been fighting since before you were born. Sit down.” You sat. | ends | pops+2 | pops_sick | +6/-8/0/+4',
         ignore='I can’t watch this | You couldn’t do hospitals. You told yourself he’d understand. He did. That’s what made it worse. | ends | pops-2, shorty-1 | pops_sick | +14/-10/0/-8',
         fkit='Go to the bar. Not drink. Just sit | You sat at the bar with a soda, thinking about Pops dying. The bartender left you alone. The smell didn’t. | ends | pops-2, ghost+1 | pops_sick | +24/-20/-30/-6',
         date='Bring Jaz to meet him | You brought Jaz. Pops told her every embarrassing story he had. She brought him soup every week after. | ends | pops+3, love+3 | pops_sick, love_touch | -6/-8/-30/+12'),
    'POPS', 'Pops missed Thursday. Pops never misses Thursday. He’s calling {N} from a hospital bed.',
    need=['popswell', 'sponsor', 'sober200'], once=True, weight=3)

sit('pops_hospital', 5, 'month', 'pops', 'POPS’ BAD WEEK',
    'The hospital calls at 4 AM. Pops took a turn. He’s asking for you, and he never asks for anything. It’s the same week as the biggest job your business has ever had: twelve lots, a $2,000 check, Ms. Patel watching. Dre is supposed to run the crew but Dre has never run anything. Pops is asking for you.',
    8, 8, 2, dict(h=10, s=24, c=-500, n=-8, trust=T('pops-3'), say='You tried to do all of it. You did none of it well. Pops slept through your visit. Ms. Patel found somebody with a logo.'),
    dict(meeting='Meeting. Then the hospital. Let Dre run the crew | You went to a meeting, then to Pops. Dre ran the crew. He lost a rake and a client. He also finished all twelve lots. | ends | pops+4, shorty+1 | | -12/-6/-300/+14',
         call='Call Dre: it’s yours this week | You handed Dre the keys and the clipboard. He called you nine times. He did it. Pops held your hand and said “good.” | ends | pops+4 | | -10/-8/-200/+12',
         help='Sit with Pops. Lose the contract | You sat with Pops for five days. Ms. Patel hired the logo company. You’d do it again. | ends | pops+5, mom+1 | | -8/-10/-1200/+14',
         rides='Hospital mornings, lots afternoons | 5 AM hospital, noon lots, 8 PM hospital. Seven days. You lost six pounds and no clients. Pops noticed the sunburn. | ends | pops+4 | | -8/+10/0/+12',
         rest='Visit once. Then the lots | You went once, then worked. He understood. He always understands. You wish he didn’t have to. | ends | pops+1 | | -5/-6/0/0',
         work='The lots. I’ll visit after | You finished the lots. Pops was asleep when you got there every night. You left the check on his tray. He didn’t need a check. | ends | pops-1, darlene+1 | | 6/12/0/-4',
         double='Do everything. Sleep nowhere | You did it all. Hospital, lots, Jaz. You fell asleep at a red light. Nobody got hurt. That was luck. | ends | pops+3, love-1 | | 10/26/0/+6',
         argue='Tell the hospital to stop calling at 4 AM | You snapped at a nurse. She’d been up thirty hours too. Pops heard it. “That’s not you, son.” | ends | pops-1 | | +10/-6/0/-4',
         ignore='I can’t be there for this | You didn’t go. You told yourself you’d go tomorrow. You finished the lots. Tomorrow kept moving. | ends | pops-4, shorty-2 | | +16/-10/+400/-10',
         fkit='Lose it. Go to the block | You went to the old block to not feel it. It worked for an hour. Ghost found you on the corner. “Rough week?” | ends | pops-3, ghost+2 | oldcontact | +28/-25/-60/-8',
         date='Jaz sits with Pops while I work | Jaz sat with Pops every afternoon while you worked. He told her every embarrassing story he had left. She wrote them down. | ends | love+3, pops+3 | love_touch | -4/-4/0/+12'),
    '4:02 AM', '4 AM. The hospital. Pops is asking for {N}. It’s the biggest week the business has ever had.',
    need=['popssick', 'biz'], once=True, weight=3)

sit('dre_relapse', 5, 'month', 'newcomer', 'DRE WENT OUT',
    'Dre calls at 2:40 AM from the block. High. Crying. “I messed up. I messed up. Don’t tell Pops.” He wants you to come get him. You know the corner. You know what’s on it. You have two hundred days and Jaz asleep in the next room. Pops always said: you don’t go alone. Pops is in the hospital.',
    16, 12, 1, dict(h=14, s=24, c=0, n=-8, trust=T('pops-2, shorty-1'), say='You didn’t pick up. Dre walked home at dawn. He never called you again. He calls Ghost now.'),
    dict(meeting='Call the 3 AM guys from the meeting | You called Sal and Benny. Three of you went. Dre got in the car without a word. He detoxed on your couch with Jaz making him eggs. | ends | pops+3, shorty+2 | | -10/-8/0/+16',
         call='Call Shorty. Go together | Shorty was in the car in four minutes. You drove, Shorty talked Dre into the back seat. Nobody got out of the car. | ends | shorty+3, pops+2 | | -8/-8/0/+14',
         help='Go get him. Engine running. Two minutes | You pulled up, honked twice, kept the engine running. Dre came out. Two minutes. Your hands shook the whole way home. | ends | pops+2 | | 0/-5/0/+14',
         rides='Drive to the corner, don’t get out | You stayed in the car with the doors locked and the phone on speaker. He walked to you. That was the deal. | ends | pops+2 | | -4/-4/0/+12',
         rest='Tell him to walk to the gas station. I’ll meet him there | You told him the gas station, four blocks off. He made it. You bought him a coffee at 3 AM and drove him to detox. | ends | pops+2 | | -6/-8/-20/+12',
         work='I have work at 6. Call a cab | You sent a cab. He didn’t get in it. He called at 5 AM, worse. | ends | pops-2 | | 6/12/-40/-6',
         argue='Yell at him over the phone | You yelled. He hung up. He was at your door at 7 AM anyway, still high, still crying. You let him in. | ends | pops+1 | | +8/-8/0/+2',
         ignore='Let it ring | You let it ring. You lay there and listened to it ring. | ends | pops-3, shorty-2 | | +14/-10/0/-12',
         fkit='Go alone | You went alone. You found him. You found everything else too. You stayed a minute. Then another. Then you got in the car with him and drove. Sober. Barely. | ends | pops-1, ghost+2 | oldcontact | +30/-15/-40/+4',
         ghostlink='Call Ghost to get him | Ghost went and got him. Ghost was already there. That’s how Ghost knew. | ends | ghost+3, pops-3 | oldcontact | +18/-12/0/-2',
         block='Go to the block, bring Jaz | You woke Jaz. She said “I’m coming.” Jaz in the passenger seat at 3 AM with her arms crossed. Dre took one look at her and got in. | ends | love+2, pops+1 | love_touch | +6/-6/0/+10'),
    'DRE', '2:40 AM. Dre on the block. High. “Don’t tell Pops.” Pops is in the hospital. {N} knows the corner.',
    need=['sponsee'], weight=3)

sit('big_contract', 5, 'month', 'client', 'TWELVE LOTS',
    'Ms. Patel’s boss owns forty-one properties. He wants a bid on twelve of them, year-round. $2,000 a month. It needs a second truck, a second crew, and insurance you don’t have. If you land it you’re a real company. If you take it and can’t deliver, you’re the guy with the logo who didn’t show up.',
    4, 4, 2, dict(h=6, s=10, c=0, n=-2, trust={}, say='You never bid. The logo company got it. You still do Ms. Patel’s six. She says “I tried” every time she sees you.'),
    dict(meeting='Ask the room for a second crew | You asked the meeting. Four guys with six months and nothing to do Saturdays. Bid sent. Bid won. | ends | pops+2 | bigjob | -10/-6/-200/+12',
         call='Ask Pops: am I ready? | Pops, from a hospital bed: “You were ready when you started showing up. Bid it.” You bid it. | ends | pops+2 | bigjob | -8/-8/0/+8',
         help='Hire Dre to run crew two | You made Dre a foreman. He bought a clipboard with his own money. Bid won. | ends | pops+2, shorty+1 | bigjob | -6/-4/-300/+12',
         rest='Too much. Say no | You said no. Safe. The lots stayed six. The logo company got twelve. | ends | | | -5/-8/0/-2',
         work='Bid it. Figure it out | You bid it. You won it. You figured it out one lot at a time. Sleep is for people without twelve lots. | ends | | bigjob | 8/16/+500/+4',
         double='Bid it AND keep the six | Eighteen lots. Two crews. One you. Jaz said she forgot what you look like. | ends | love-2, pops+1 | bigjob | 10/24/+900/+2',
         quit='Sell the business to the logo guys | They offered $4,000 for your clients. You took it. Back to the warehouse Monday. | ends | darlene+1, pops-1 | | 6/-10/+4000/-4',
         argue='Lowball to win it | You bid too low to beat the logo guys. You won. You’re losing money on every lot. | ends | | bigjob | +10/+10/+300/0',
         ignore='Let the deadline pass | The bid was due Friday. You remembered Monday. | ends | | | +6/-4/0/-4',
         fkit='Celebrate before I win it | You threw a party for a contract you hadn’t won. Ms. Patel’s boss saw the pictures. | ends | pops-2, ghost+1 | | +20/-20/-300/-6',
         bizfund='Buy the second truck first | You bought the truck, then bid. “Already equipped.” That line won it. | ends | pops+1 | bigjob | 0/-6/0/+8',
         date='Jaz builds the bid | Jaz built a bid with a spreadsheet and a cover letter. Ms. Patel’s boss said it was the only professional one he got. | ends | love+3 | bigjob, love_touch | 0/-8/-50/+10'),
    'MS. PATEL', 'Twelve lots. $2,000 a month. A second truck {N} doesn’t have. The logo company is bidding too.',
    need=['biz'], once=True, weight=2)

sit('truck_dies', 5, 'month', 'mechanic', 'THE TRUCK DIED',
    'The truck died on the highway with a trailer full of mowers and twelve lots due Friday. The mechanic says transmission. $1,800 or a new truck. You have four days, a crew waiting on a text, and a client who’s heard every excuse from every guy with a logo.',
    8, 8, 2, dict(h=10, s=18, c=-600, n=-6, trust={}, say='You missed Friday. Then the next Friday. Ms. Patel’s boss hired the logo guys. The truck sat in the driveway all winter like a monument.'),
    dict(meeting='Meeting. Borrow Sal’s truck for the week | You asked the room. Sal’s truck for a week, and Benny knows a transmission guy. Friday got done. | ends | pops+1 | | -10/-6/-900/+10',
         call='Call Pops. He knows a guy | Pops’ guy rebuilt it for $1,100 and a case of ginger ale. “Tell Pops he still owes me from ’94.” | ends | pops+1 | | -8/-8/-1100/+6',
         help='Crew pushes mowers to the near lots | You and Dre pushed the mowers four blocks to the three closest lots. Ms. Patel drove by, laughed, and extended the contract. | ends | shorty+1, pops+1 | | -6/+4/-400/+12',
         rest='Call the client. Tell the truth | You called and said the truck died and you’d be three days late. She said “you’re the first one who ever called.” | ends | | | -5/-12/-1800/+8',
         work='Pay the mechanic. Eat it | $1,800. The whole month’s profit. Truck fixed Wednesday. Lots done Friday. Jaz did the math out loud at dinner. | ends | | | 6/10/-1800/0',
         double='Rent a truck and work nights | A rental, headlights, and two 16-hour days. Friday done. You slept Saturday. All of it. | ends | love-1 | | 8/20/-700/+2',
         quit='Walk away from the business | You sold the mowers and went back to the warehouse. Darlene said “I kept your locker.” | ends | darlene+2, pops-1 | | 6/-12/+800/-4',
         argue='Argue with the mechanic | You said transmission was a scam. He showed you the transmission. In pieces. On the floor. | ends | | | +10/-6/-1800/-2',
         ignore='Wait for it to fix itself | Trucks don’t. Friday came. The crew went home. | ends | | | +8/-6/0/-8',
         fkit='Sell the mowers to Ghost | Ghost bought the mowers for a third of what they cost and asked if you wanted to make some real money. | ends | ghost+3, pops-2 | oldcontact | +22/-18/+500/-6',
         bizfund='Buy a second truck. Keep the first for parts | You pulled the stack and bought a second truck. Two trucks, one works. That’s a fleet. | ends | | | 0/-4/0/+6'),
    'MECHANIC', 'The truck died on the highway. Transmission. Twelve lots due Friday. {N} has four days.',
    need=['biz'], once=True)

sit('baby_comes', 5, 'month', 'love', 'THE BABY',
    'Jaz’s water breaks at 3 AM in the kitchen. You have a car with a check engine light, a crew that starts at 7, and a hospital bag by the door that she packed two weeks ago because she knew you wouldn’t. Twenty-six hours later, somebody hands you a person. The nurse asks for the father’s name. It takes you a second to realize she means you.',
    6, 6, 1, dict(h=6, s=20, c=0, n=-6, trust=T('love-3, mom-2'), say='You missed it. You were at the lots. Her mom cut the cord. Jaz says it’s fine. Jaz says a lot of things are fine now.'),
    dict(meeting='Text the group from the delivery room | You texted the Thursday meeting from the hallway: “it’s a girl.” Forty replies in a minute. Pops sent a thumbs up from his hospital bed. | ends | love+4, pops+2, mom+2 | love_touch, baby_born | -10/-8/-100/+16',
         call='Call Mom from the parking lot | You called Mom at 3:15 AM. She was dressed before you hung up. She was there before you parked. | ends | love+3, mom+4 | love_touch, baby_born | -8/-6/-100/+14',
         help='Be in the room. Every minute | Twenty-six hours. You didn’t leave. You didn’t check your phone. Dre ran the crew. The nurse said “that’s a good one” about you, to Jaz. | ends | love+5, mom+2 | love_touch, baby_born | -6/-4/-200/+16',
         rides='Drive like it’s the only thing | 3 AM, check engine light, forty over. You made the hospital in eleven minutes. Then you waited twenty-six hours. | ends | love+4 | love_touch, baby_born | -8/0/-100/+14',
         rest='Sleep in the chair. Be there in the morning | You slept in the chair. Jaz woke you up to hold her. Her. The baby. Both. | ends | love+3 | love_touch, baby_born | -5/-10/-100/+12',
         work='Drop her off. Run the crew. Come back | You dropped her off and went to work. She said go. She didn’t mean it. You got back at the end. Her mom was already holding the baby. | ends | love-1, mom-1 | baby_born | 6/14/+300/-2',
         double='Work through it. Somebody has to pay | You worked. Twelve lots. Then the hospital bill came and you understood why you worked. Jaz understood too. Eventually. | ends | love-2, darlene+1 | baby_born | 8/20/+600/-4',
         argue='Panic. Argue with the nurse | You argued with a nurse about the parking validation during a contraction. Jaz says it’s her favorite story about you now. | ends | love+1 | love_touch, baby_born | +8/-6/-100/+6',
         ignore='Wait in the car | You sat in the parking garage for four hours. You went up eventually. She didn’t ask where you’d been. She knew. | ends | love-2, mom-1 | baby_born | +10/-10/-100/-2',
         fkit='Go to the bar to “celebrate” | You went to the bar after. To celebrate. With a soda. The guy next to you bought you a shot. It sat there. You looked at it for a long time. | ends | love-4, pops-3 | baby_born | +26/-20/-60/-6',
         date='Her mom and your mom in the room together | Both moms. One room. They fought over the baby’s name and agreed on yours. “He stayed.” That’s what they said about you. | ends | love+5, mom+3 | love_touch, baby_born | -6/-6/-150/+16'),
    'JAZ', '3 AM. Jaz’s water broke in the kitchen. {N}’s car has a check engine light and the hospital bag is by the door.',
    need=['pregnant', 'together', 'baby_due'], once=True, weight=4,
    girl=dict(setup='Your water breaks at 3 AM in the kitchen. Marc has the bag by the door that you packed two weeks ago because you knew he wouldn’t. The car has a check engine light. Twenty-six hours later, somebody hands you a person. The nurse asks for your name for the bracelet. It takes you a second to say it like it belongs to a mother.',
              narr='3 AM. {N}’s water broke in the kitchen. Marc has the bag. The car has a check engine light.',
              thread='MARC'))

sit('thanksgiving', 5, 'month', 'mom', 'FIRST THANKSGIVING SOBER',
    'Mom’s table. The whole family. Your uncle, who brings a cooler and an opinion. Your cousin, who “just wants to see if you’re really different.” Jaz on one side, Mom on the other, and a bottle of wine open in the middle of the table because nobody thought about it, because why would they. It’s the first holiday you’ve been invited to in six years.',
    6, 6, 2, dict(h=8, s=12, c=0, n=-6, trust=T('mom-2, love-1'), say='You skipped it. Mom set a plate anyway. Jaz went without you and came home quiet.'),
    dict(meeting='Meeting that morning. Then dinner | You hit the 9 AM gratitude meeting, then drove to Mom’s with a pie. Your uncle offered. You said “I’m good.” You were. | ends | mom+3, love+2, pops+1 | love_touch | -12/-8/-20/+14',
         call='Call Pops from the driveway | You sat in the driveway and called Pops. “Go in. Eat. Leave when you want. Call me from the driveway after.” You did both calls. | ends | mom+2, pops+2, love+1 | love_touch | -10/-8/0/+10',
         help='Do the dishes. All of them | You did every dish. Your uncle came in to “help,” stood there, and said “I’m proud of you” to the sink. | ends | mom+3 | | -8/-5/0/+12',
         rest='Leave early. Say nothing | You lasted till the pie, kissed Mom, and left. She said “thank you for coming.” She meant it. | ends | mom+2, love+1 | love_touch | -5/-8/0/+6',
         work='Work the holiday. Double pay | Darlene paid double. Mom set a plate anyway. Jaz brought you a plate at the dock at 9 PM. | ends | darlene+2, mom-1, love+1 | | 6/10/+200/-2',
         argue='Argue with my uncle about rehab | Your uncle said rehab’s for the weak. You said some things. Mom said “not at my table.” You both shut up. | ends | mom-1 | | +14/-10/0/-4',
         ignore='Sit on the porch the whole time | You sat on the porch all dinner. Jaz brought you a plate. Mom brought you a blanket. Nobody made you come in. | ends | mom+1, love+1 | | +6/-10/0/-2',
         fkit='One glass. It’s a holiday | Your cousin poured. You picked it up. You looked at Jaz. You put it down. Your hand shook for an hour. | ends | love-2, pops-2, mom-1 | | +28/-20/0/-8',
         crew='Leave early for the crew’s Thanksgiving | You left Mom’s for the crew’s “Friendsgiving.” It was a party with a turkey. You left that one early too. | ends | ghost+1, mom-2 | | +12/-18/-20/0',
         date='Bring Jaz. Let them see | You brought Jaz. Nobody looked at the wine all night. Your uncle told her every story about you and cried at two of them. | ends | mom+4, love+3 | love_touch | -8/-10/-20/+16'),
    'MOM', 'Thanksgiving. Mom’s table. An open bottle in the middle nobody thought about. First invite in six years for {N}.',
    once=True, weight=2)

sit('year_speaker', 5, 'month', 'pops', 'THE ONE-YEAR MEETING',
    'Pops, thin, out of the hospital for now, asks you to be the speaker at the Thursday meeting. Your one-year meeting. “Twenty minutes. Say what it was like, what happened, what it’s like now. Don’t make a speech.” Mom wants to come. Jaz wants to come. Dre wants to come. Big Ray says he might. You have never once talked for twenty minutes without lying.',
    4, 4, 2, dict(h=6, s=10, c=0, n=-4, trust=T('pops-2'), say='You said you weren’t ready. Pops nodded. He asked Benny. Benny said yes.'),
    dict(meeting='Say yes. Sweat for a month | You said yes and sweated for a month. Then you stood up and told the truth for twenty-two minutes. Nobody checked their phone. | ends | pops+4, mom+2, love+2 | year_ready | -14/-10/0/+18',
         call='Practice on Pops every night | You practiced on Pops every night for a month. He fell asleep twice. “That part’s boring. Cut it.” You cut it. | ends | pops+4 | year_ready | -10/-10/0/+12',
         help='Ask Dre to introduce me | You asked Dre to introduce you. He wrote it on a napkin and read it with shaking hands. “This is my sponsor.” That was the whole intro. | ends | pops+3, shorty+2 | year_ready | -8/-6/0/+16',
         rest='Write it down. Then throw it away | You wrote it out. Then Pops said “no notes.” You threw it away. You knew it anyway. | ends | pops+2 | year_ready | -5/-10/0/+6',
         work='Say yes, keep working, wing it | You said yes and didn’t prepare. You stood up with nothing and said everything. It was the best one anybody’d heard in years. | ends | pops+3 | year_ready | 6/10/0/+10',
         argue='Tell Pops I’m not a speaker | You told Pops you’re not a speaker. He said “I know. That’s why I asked.” You said yes to shut him up. | ends | pops+2 | year_ready | +4/-6/0/+4',
         ignore='Say I’ll think about it | You said you’d think about it. Pops is sick. Thinking about it is not a thing you get to do anymore. You said yes a week later. | ends | pops+1 | year_ready | +6/-8/0/+2',
         fkit='Not me. Ask Benny | You said ask Benny. Benny spoke. You sat in the back and felt it. Pops didn’t look at you once. | ends | pops-3 | | +18/-12/0/-8',
         date='Jaz sits front row | You said yes because Jaz said she’d be in the front row. She was. She cried at the part about the shoes. | ends | love+3, pops+3 | year_ready, love_touch | -6/-8/0/+14'),
    'POPS', 'Pops wants {N} to speak at the one-year meeting. Twenty minutes. No lying. Mom’s coming.',
    need=['year', 'sponsor'], once=True, weight=5)

# ---------------------------------------------------------------- text threads
THREADS = {
 'trip_moves_in': [('ray','NEW RESIDENT IN ROOM 4. TRIP. BE RESPECTFUL.'),('shorty','yo my shoes are gone'),('house','my charger too'),('shorty','he WEARING my shoes. right now. in the kitchen'),('you','you tell ray?'),('shorty','you tell ray. he looked at me'),('house','he looks at everybody'),('shorty','not like that')],
 'trip_knife': [('shorty','u up'),('you','yeah'),('shorty','trip pulled a knife on me'),('shorty','in the kitchen. over MILK'),('you','where is he now'),('shorty','his room. he said if anybody tells ray the house gonna have an accident'),('shorty','what do i do'),('you','dont go back in the kitchen'),('shorty','i cant stay here man'),('shorty','what are YOU gonna do')],
 'insurance_and_flat': [('mechanic','Tire $180. Light = don’t ask.'),('you','whats the light'),('mechanic','I said don’t ask'),('shorty','yo can u take me to court thurs 9am'),('pops','Doctor Friday at 2. If you can.'),('you','yeah'),('you','yeah'),('love','insurance due today btw 😬'),('you','i know')],
 'darlene_lead': [('darlene','Office. Before your shift.'),('you','what i do'),('darlene','Nothing. That’s the problem with everybody else.'),('darlene','Lead on second shift. $120. Clipboard. My schedule.'),('you','your schedule is meeting night'),('darlene','My schedule is the schedule.'),('darlene','Friday. Yes or no.')],
 'jaz_cookout': [('love','sat is the cookout 🍖'),('love','my whole family. they need to see you’re real'),('you','your uncle gonna be there'),('love','my uncle lives there lol'),('pops','Speaker meeting Saturday. Can you drive me? Buick’s down.'),('you','what time'),('pops','Noon.'),('love','cookout starts at 1. and my cousin’s bringing his cooler so'),('love','so just stay near me ok')],
 'dre_first_meeting': [('newcomer','its dre'),('newcomer','ray said i gotta hit a meeting or im out'),('newcomer','can you take me'),('you','why me'),('newcomer','you the only one dont look at me like i already failed'),('newcomer','i dont know what to do in there'),('you','sit down and shut up mostly'),('newcomer','i can do that'),('newcomer','probably')],
 'mom_amends': [('mom','Sunday still good?'),('you','yeah'),('mom','I’ll make the chicken.'),('mom','Don’t make a speech, baby. Just come.'),('pops','Did you write the list?'),('you','4 pages'),('pops','Cut three.'),('you','which three'),('pops','The ones that make YOU feel better.')],
 'ghost_collects': [('ghost','400'),('you','for what'),('ghost','from back when. i let it ride cause you was sick'),('ghost','you got a job now'),('you','i dont remember owing you'),('ghost','you dont remember a lot lol'),('ghost','im outside the warehouse. no rush'),('ghost','friendly')],
 'shorty_relapse': [('ray','ANYBODY SEEN SHORTY'),('house','not since tuesday'),('unknown','im ok'),('unknown','its shorty. dont tell ray'),('you','where u at'),('unknown','you know where'),('you','im coming to get you'),('unknown','dont come here'),('unknown','please dont')],
 'lights_notice': [('landlord','FYI utilities are in your name. Not mine.'),('landlord','Not my problem.'),('you','i know'),('love','did u see the pink paper on the door'),('you','yeah'),('love','its $140 by the 14th'),('you','i got 60'),('love','...'),('love','ok. we figure it out')],
 'dre_asks': [('newcomer','can i ask u something'),('newcomer','like in person'),('you','whats up'),('newcomer','60 days today'),('you','thats big'),('newcomer','pops said ask you'),('newcomer','will you sponsor me'),('newcomer','you dont gotta answer now'),('newcomer','but like'),('newcomer','kinda now')],
 'jaz_pregnant': [('love','we need to talk'),('you','ok'),('you','jaz?'),('you','you ok?'),('love','coming over'),('love','4 hrs later'),('love','im outside'),('love','dont freak out')],
 'jaz_pregnant_girl': [('love','you still sick?'),('you','its the warehouse'),('love','its been a week'),('love','im bringing something over'),('you','what'),('love','just open the door'),('love','and dont freak out'),('love','ok maybe freak out a little')],
 'ex_amends': [('ex','hey. new number'),('ex','im in a program now. 94 days'),('ex','i owe you an amends'),('ex','can we meet? daytime. public. i know'),('you','let me think'),('pops','Amends don’t require a reunion. Coffee. Daylight. Thirty minutes.'),('ex','whenever you’re ready')],
 'dre_court': [('newcomer','court is the 15th 9am'),('newcomer','downtown'),('newcomer','i dont got a suit or a ride'),('love','ultrasound moved to the 15th!! 10:30 🥹'),('darlene','Quarterly is the 15th. I need you.'),('client','Can we meet the 15th re: the lots? Morning works.'),('you','...'),('newcomer','if i miss it its a warrant')],
 'first_client': [('client','Hi, this is Ms. Patel. I manage the duplexes on Carver.'),('client','I saw you clear Mr. Henry’s yard.'),('client','I have six properties. Every two weeks through October.'),('you','how much you thinking'),('client','You tell me. $900/mo is my budget.'),('client','I need somebody who shows up.'),('you','i can show up')],
 'warrant_check': [('unknown','COUNTY OF MERCER. NOTICE OF BENCH WARRANT. FAILURE TO APPEAR.'),('you','pops i got a warrant'),('pops','From when?'),('you','before'),('pops','Then handle it like after. Turn yourself in. I’ll drive.'),('ghost','just dont drive thru mercer lol'),('ghost','and dont get pulled over')],
 'pops_diagnosis': [('pops','Missing Thursday.'),('you','you never miss thursday'),('pops','Hospital. Pancreas. They’re gonna try some things.'),('you','which hospital'),('pops','Don’t make a fuss.'),('pops','They want an emergency contact.'),('pops','I don’t have one.'),('pops','Would you mind.')],
 'pops_hospital': [('nurse','This is Mercy General. Mr. Washington took a turn. He’s asking for you.'),('client','Twelve lots start Monday. Check’s ready Friday. Counting on you.'),('newcomer','i can run the crew. i think. can i?'),('love','cant sleep. come home when you can. or dont. go be with him'),('you','...'),('nurse','He’s asking for you by name.')],
 'dre_relapse': [('newcomer','i messed up'),('newcomer','i messed up i messed up'),('you','where are you'),('newcomer','the block. the house. you know'),('newcomer','dont tell pops'),('newcomer','please come get me'),('you','is anybody with you'),('newcomer','everybody is with me'),('newcomer','thats the problem')],
 'big_contract': [('client','My boss saw your work. 41 properties.'),('client','He wants a bid on 12. Year-round. $2k/mo.'),('client','Needs a second truck, second crew, liability insurance.'),('client','The logo company is bidding too.'),('you','when is it due'),('client','Friday.'),('love','you can do this. i’ll do the paperwork')],
 'truck_dies': [('newcomer','truck wont go'),('newcomer','like at all. on the highway'),('you','what happened'),('newcomer','it made a noise then no noise'),('mechanic','Transmission. $1,800 or a new truck.'),('client','Still on for Friday?'),('you','yeah'),('you','yeah we’re on')],
 'baby_comes': [('love','my water broke'),('love','in the KITCHEN'),('love','get up'),('you','im up'),('love','the bag is by the door'),('love','the one i packed. because i knew'),('you','car light is on'),('love','I DONT CARE ABOUT THE LIGHT')],
 'baby_comes_girl': [('you','my water broke'),('love','ok. ok. ok'),('love','im getting the bag'),('you','the kitchen floor is'),('love','dont worry about the floor'),('love','car light is on'),('you','I DONT CARE ABOUT THE LIGHT'),('love','getting the keys')],
 'thanksgiving': [('mom','Thanksgiving. 2:00. You’re coming.'),('mom','Bring Jaz.'),('you','is uncle ray coming'),('mom','He lives here, baby.'),('mom','He’s bringing the cooler. I told him no. He’s bringing it.'),('love','what do i wear to meet your whole family'),('you','armor')],
 'year_speaker': [('pops','Thursday. Your year.'),('pops','Twenty minutes. What it was like, what happened, what it’s like now.'),('pops','Don’t make a speech.'),('you','i cant talk for 20 min'),('pops','You talked for 20 years. Try the truth this time.'),('mom','Pops said you’re speaking?? I’m coming.'),('love','front row. im bringing tissues'),('newcomer','can i introduce you')],
 'year_chip': [('pops','Stand up.'),('you','i cant even type rn'),('mom','He’s standing. He’s standing up.'),('shorty','WE ALL STANDING'),('newcomer','thats my sponsor. thats him'),('love','im crying. everybody’s crying. ray is crying'),('ray','Told you most of them don’t make it. Glad you did.'),('darlene','Don’t be late Monday.'),('pops','One year. Now go do another day.')],
}

def main():
    # situations
    sp = ROOT + 'situations.js'; src = open(sp).read()
    i = src.index('[', src.index('const SITUATIONS')); j = src.index(';\nif (typeof module')
    S = json.loads(src[i:j])
    S = [c for c in S if not any(c['id'] == n['id'] for n in SITS)]
    for n in SITS:
        moves = {}
        for k, m in n['moves'].items():
            e = m['eff'] or list(BASE[k])
            moves[k] = dict(h=e[0], s=e[1], c=e[2], n=e[3], trust=m['trust'], end=m['end'], gives=m['gives'], say=m['say'])
        c = dict(id=n['id'], ch=n['ch'], scale=n['scale'], title=n['title'], who=n['who'], setup=n['setup'], now=n['now'], daily=n['daily'], days=n['days'], moves=moves, expire=n['expire'], need=n['need'], once=n['once'], weight=n['weight'], late=n['late'])
        if n['girl']: c['girl'] = {k: v for k, v in n['girl'].items() if k in ('setup', 'title')}
        S.append(c)
    open(sp, 'w').write(src[:i] + json.dumps(S, indent=0, ensure_ascii=False) + src[j:])
    # words
    wp = ROOT + 'words.js'; src = open(wp).read()
    i = src.index('{', src.index('const WORDS')); j = src.index(';\nif (typeof module')
    W = json.loads(src[i:j])
    for n in SITS: W[n['id']] = {k: m['word'] for k, m in n['moves'].items()}
    open(wp, 'w').write(src[:i] + json.dumps(W, indent=0, ensure_ascii=False) + src[j:])
    # convos
    cp = ROOT + 'convos.js'; src = open(cp).read()
    i = src.index('{', src.index('const CONVOS')); j = src.index(';\nif (typeof module')
    C = json.loads(src[i:j])
    for n in SITS:
        C[n['id']] = dict(narr=n['narr'], thread=n['thread'], msgs=[list(m) for m in THREADS[n['id']]])
        if n['girl'] and n['id'] + '_girl' in THREADS:
            C[n['id'] + '_girl'] = dict(narr=n['girl']['narr'], thread=n['girl']['thread'], msgs=[list(m) for m in THREADS[n['id'] + '_girl']])
    C['year_chip'] = dict(narr='Thursday. The room is full. {N} has one year.', thread='THE ROOM 🪑', msgs=[list(m) for m in THREADS['year_chip']])
    open(cp, 'w').write(src[:i] + json.dumps(C, indent=1, ensure_ascii=False) + src[j:])
    print(len(SITS), 'situations;', len(S), 'total;', len(W), 'words;', len(C), 'threads')

if __name__ == '__main__': main()
