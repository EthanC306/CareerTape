import { calculateMatchScore } from "./scoring"

export type Eligibility = "eligible" | "future" | "verify"

export type Employer = {
  id: string
  name: string
  initials: string
  industry: string
  role: string
  score: number
  technicalFit: number
  eligibility: Eligibility
  eligibilityLabel: string
  schoolYears: string
  location: string
  website: string
  booth: string
  accent: string
  skills: string[]
  reasons: string[]
  questions: string[]
  breakdown: { label: string; score: number; weight: string }[]
}

type RosterEmployer = {
  name: string
  industry: string
  role: string
  years: string
  location: string
  website: string
  roleFit: number
  clarity: number
}

const rows = `
3C Industries|Construction services|No specific roles listed|Junior, Senior, Certificate Program, Alumni|Urbana, Ohio|https://3cindustries.com/|10|20
Administrative Controls Management, Inc.|Project controls consulting|Project Engineers / Analysts (Construction)|Senior, Masters, MBA, Alumni|Westerville, Ohio|http://www.acmpm.com|18|75
ADR & Associates, LTD|Civil engineering + surveying|Project Civil Engineer; Intern Civil Engineer|Freshman, Sophomore, Junior, Senior|Newark, Ohio|http://www.adrinnovation.com/|22|90
Advanced Civil Design, Inc.|Civil engineering + surveying|Traffic Engineer; Civil Co-op; Surveying Technician|Junior, Senior, Alumni|Columbus, Ohio|http://www.advancedcivildesign.com|12|90
American Electric Power|Energy + utilities|Internship — team not specified|Freshman, Sophomore, Junior|Columbus, Ohio|http://www.aep.com|72|42
AMT Engineering|Engineering consultancy|Transportation, Water Resources, Civil Engineering|Not listed|Rockville, Maryland|https://amtengineering.com/|16|85
Andritz Inc.|Industrial technology|Controls Engineer|Not listed|Alpharetta, Georgia|http://www.andritz.com|62|88
Arcadis|Engineering + consulting|Engineering, Consulting, Geology and Environmental roles|Freshman, Sophomore, Junior, Senior, Masters, Alumni|Multiple locations|http://www.arcadis.com|32|72
Ariel Corporation|Industrial manufacturing|Co-op — role not specified|Sophomore, Junior, Senior, Masters|Mount Vernon, Ohio|http://www.arielcorp.com|42|40
Austin Powder Company|Industrial manufacturing|No role details listed|Not listed|Cleveland, Ohio|http://www.austinpowder.com|25|10
Balluff Inc|Factory automation|Technical Sales Engineer|Senior, Masters|Florence, Kentucky|http://www.balluff.com|55|92
Beaver Excavating Company|Heavy construction|Engineer Co-op; Assistant Project Engineer|Sophomore, Junior, Senior, Masters, Alumni|Canton, Ohio|http://www.beaverexcavating.com|13|88
Bi-Con Services, Inc.|Energy + manufacturing construction|No specific roles listed|Sophomore, Junior, Senior, Alumni|Derwent, Ohio|http://www.bi-conservices.com|28|25
Brayman Construction Corporation|Heavy civil construction|No specific roles listed|Freshman, Sophomore, Junior, Senior|Saxonburg, Pennsylvania|http://www.brayman.com|10|25
Brewer Science, Inc.|Advanced materials + electronics|Job or internship — role not specified|Freshman, Sophomore, Junior, Senior, Masters, Doctorate, Postdoctoral|Rolla, Missouri|http://www.brewerscience.com|58|42
Burgess & Niple, Inc.|Infrastructure engineering|Entry-Level Traffic Engineer|Sophomore, Junior, Senior, Masters|Columbus, Ohio|http://www.burgessniple.com/|20|82
Carpenter Marty Transportation|Transportation engineering|No specific roles listed|Not listed|Columbus, Ohio|http://www.cmtran.com|15|25
CAS - Technology|Scientific information technology|Technology internship — team not specified|Sophomore, Junior, Senior, Masters|Columbus, Ohio|http://www.cas.org|98|72
Ceco Concrete Construction|Concrete construction|Internship & New Grad Roles|Not listed|Kansas City, Missouri|http://www.cecoconcrete.com/|10|55
Celanese|Specialty materials|Chemical, Mechanical, Electrical Engineering Intern|Sophomore, Junior|Irving, Texas|http://celanese.com|28|95
Centrus Energy|Nuclear energy technology|All positions|Not listed|Oak Ridge, Tennessee|https://www.centrusenergy.com/|58|48
CESO, Inc.|Site + building services|Internship — role not specified|Freshman, Sophomore, Junior, Senior|Miamisburg, Ohio|http://www.cesoinc.com|16|38
CK Construction|Commercial construction|Estimator Co-op — Summer 2027|Not listed|Westerville, Ohio|https://www.ckbuilds.com|12|90
Cleveland-Cliffs|Steel + industrial technology|IT, Process Control, Engineering and Research internships|Sophomore, Junior, Senior|Ohio|https://careers.clevelandcliffs.com/|82|92
Commonwealth Associates Inc.|Electric utility engineering|Engineering Intern|Sophomore, Junior, Senior|Jackson, Michigan|http://www.cai-engr.com|42|80
Constellium|Advanced manufacturing|Engineering Internships|Sophomore, Junior, Senior, Alumni|Ravenswood, West Virginia|http://www.constellium.com|45|72
CTL Engineering, Inc.|Engineering consulting|Construction Inspectors; Field / Project Engineers|Sophomore, Junior, Senior, Masters, Alumni|Columbus, Ohio|http://www.ctleng.com|14|85
Danis Building Construction|Construction management|Co-op|Not listed|Miamisburg, Ohio|http://www.danis.com|10|60
DGL Consulting Engineers|Civil + transportation engineering|CAD, Civil, Inspection and Survey Co-ops|Freshman, Sophomore, Junior, Senior, Certificate Program|Maumee, Ohio|https://www.dgl-ltd.com|18|95
DHL Supply Chain|Logistics + supply chain|Job or internship — role not specified|Sophomore, Junior, Senior, Masters, Alumni|Westerville, Ohio|http://www.dhl-usa.com/supplychain|60|38
Elford, Inc.|Commercial construction|Field / Project Engineer Intern and entry-level roles|Freshman, Sophomore, Junior, Senior|Columbus, Ohio|http://www.elford.com|12|92
EMH&T|Civil engineering + planning|Student Intern; Engineer Intern|Sophomore, Junior, Senior, Masters|New Albany, Ohio|https://www.emht.com/|18|85
Engelke Construction Solutions|Construction services|Assistant Project Manager|Not listed|Brunswick, Ohio|http://www.engelkecs.com|10|82
Environmental Design Group|Planning + engineering|Job, internship or co-op — role not specified|Sophomore, Junior, Senior, Masters|Akron, Ohio|http://www.envdesigngroup.com|18|35
GBC Design, Inc.|Engineering + architecture|Civil Engineer; Technician / Drafter; Architect|Junior, Senior, Masters|Akron, Ohio|http://gbcdesign.com|12|92
Geiger Brothers|Industrial construction|Assistant Project Manager|Senior, Masters|Jackson, Ohio|http://geigerbrothers.com/|10|82
General Mills|Consumer goods + manufacturing|Job or internship — role not specified|Sophomore, Junior, Senior|Golden Valley, Minnesota|http://careers.generalmills.com/|58|38
George J. Igel & Co., Inc.|Heavy civil construction|Project Engineer — Columbus|Not listed|Columbus, Ohio|http://www.buildwithigel.com|10|88
Harral and Stevenson, LLC|Civil engineering + surveying|Civil Engineers|Freshman, Sophomore, Junior, Senior, Masters|Circleville, Ohio|https://www.harralstevenson.com/|12|85
Hazen and Sawyer|Water engineering|Assistant Resident Engineer|Junior, Senior|Multiple locations|http://www.hazenandsawyer.com/|12|88
HDR, Inc.|Engineering + architecture|Engineer; Intern; EIT|Freshman, Sophomore, Junior, Senior, Masters, Alumni|Multiple locations|https://www.hdrinc.com|28|62
Innovative Refrigeration Systems, Inc.|Industrial refrigeration|Mechanical, Electrical or Sales Engineer|Not listed|Lyndhurst, Virginia|https://www.r717.net|28|92
Integrated Solutions for Systems (IS4S)|Defense + software engineering|2027 Internships|Sophomore, Junior, Senior|Huntsville, Alabama|http://www.is4s.com|96|96
Kokosing|Construction + infrastructure|Midwest Summer 2027 Co-op|Freshman, Sophomore, Junior, Senior|Westerville, Ohio|http://www.kokosing.biz|12|95
Korda/Nemeth Engineering, Inc.|Multidisciplinary engineering|Civil, Bridge and Entry-Level Electrical Engineering|Sophomore, Junior, Senior|Columbus, Ohio|https://www.korda.com/|24|96
Laporte Consultants Corp.|Engineering consulting|No role details listed|Not listed|King of Prussia, Pennsylvania|https://laporteconsultants.com/|22|10
Lehman Daman Construction Services, Inc.|Commercial construction|Construction Co-op — Spring / Summer 2027|Not listed|Westerville, Ohio|https://www.lehmandaman.com/|10|92
Lithko Contracting|Concrete construction|Construction Intern; Project Engineer|Freshman, Sophomore, Junior, Senior|West Chester, Ohio|https://lithko.com/|10|94
Messer Construction Co.|Commercial construction|Project Engineer; Assistant Superintendent; Co-op|Freshman, Sophomore, Junior, Senior|Cincinnati, Ohio|http://www.messer.com|10|95
METTLER TOLEDO|Precision instruments + technology|Job or internship — role not specified|Sophomore, Junior, Senior|Columbus, Ohio|http://www.mt.com|66|40
Momentive Performance Materials|Advanced materials|Engineering Intern; Manufacturing / Environmental Engineer|Freshman, Sophomore, Junior, Senior, Masters|Niskayuna, New York|http://www.momentive.com|40|88
MS CONSULTANTS, INC.|Engineering + architecture consulting|Summer 2027 Internship|Sophomore, Junior, Senior, Masters|Columbus, Ohio|http://www.msconsultants.com/careers|18|82
Nationwide|Insurance + financial technology|Software, Cyber, Data, QA and Technology internships|Junior|Columbus, Ohio|http://www.nationwide.com|99|100
Naval Surface Warfare Center — Crane|Defense technology|Electrical Engineering|Freshman, Sophomore, Junior, Senior, Masters, Doctorate, Alumni|Crane, Indiana|https://www.navsea.navy.mil/Home/Warfare-Centers/NSWC-Crane/|68|82
Ohio Department of Transportation|Public infrastructure|Job or internship — role not specified|Freshman, Sophomore, Junior, Senior, Masters|Columbus, Ohio|http://www.transportation.ohio.gov|48|38
OHM Advisors|Engineering + planning|Civil Engineering Intern / Graduate Engineer — May 2027|Freshman, Sophomore, Junior, Senior, Masters, Alumni|Ohio|http://www.ohm-advisors.com|18|98
Parker Hannifin Corporation|Motion + control technology|Environmental Health & Safety Leadership Program|Senior|Cleveland, Ohio|http://www.parker.com|42|96
Paul J. Ford and Company|Structural engineering|Entry-Level Structural Engineer|Senior, Masters, Alumni|Columbus, Ohio|http://pauljford.com/|10|100
PCL Solar Constructors|Solar construction|No specific roles listed|Sophomore, Junior, Senior, Alumni|Denver, Colorado|http://www.pcl.com|18|28
Pickering Associates|Architecture + engineering|Interns / Engineers|Not listed|Ohio + West Virginia|http://www.pickeringusa.com|20|58
Progressive Insurance - IT|Insurance technology|Software Developer, Test, QA and Project Management|Junior, Senior, Masters|Mayfield, Ohio|https://careers.progressive.com/pages/students-graduates/|99|100
RoviSys|Industrial automation + information systems|Automation Systems Engineer / Controls Specialist|Sophomore, Junior, Senior, Masters, Alumni|Aurora, Ohio|http://www.rovisys.com|84|94
rpGatta inc|Automation engineering|Controls / Automation Engineer Intern|Sophomore, Junior, Senior, Alumni|Aurora, Ohio|http://www.rpgatta.com/|78|98
Ruscilli Construction Co.|Construction management|Project Engineer Intern|Not listed|Dublin, Ohio|http://www.ruscilli.com|10|92
Schaeffler|Motion technology|Co-op; Leadership Program; Entry-Level Business|Freshman, Sophomore, Junior, Senior, Masters, MBA|Multiple locations|http://www.schaeffler.us/careers|58|75
Shelly & Sands Inc.|Heavy highway construction|Project Managers|Sophomore, Junior, Senior|Zanesville, Ohio|http://www.shellyandsands.com|10|82
SMC Corporation of America|Automation + controls|Sales Development Trainee / Sales Engineer|Senior, Alumni|Cleveland region|https://www.smcusa.com/careers|55|95
Southern Ohio Cleanup Company|Environmental remediation|Internship / Co-op — role not specified|Not listed|Piketon, Ohio|https://jobs.silkroad.com/SOCCo/Careers|32|38
Spicer Group, Inc.|Engineering + surveying|Civil, Water, Construction, Environmental, Surveying|Freshman, Sophomore, Junior, Senior, Masters, Alumni|Michigan + Georgia|http://www.spicergroup.com|18|92
Stantec|Engineering + design|No role details listed|Not listed|Multiple geographies|https://www.stantec.com/en|30|10
Strand Associates, Inc.|Engineering consulting|Civil / Environmental Engineer or Intern|Sophomore, Junior, Senior, Masters, Doctorate, Alumni|Multiple locations|http://www.strand.com|18|96
Summit Construction Company|Construction management|Co-op; Project Engineer; Assistant Superintendent|Freshman, Sophomore, Junior, Senior, Masters|Akron, Ohio|http://www.summitconstruction.com|10|95
Sunesis Construction Co.|Heavy civil construction|Project Manager|Sophomore, Junior, Senior|West Chester, Ohio|https://www.sunesisconstruction.com|10|88
Swagelok Company|Industrial manufacturing|Job, internship or co-op — role not specified|Freshman, Sophomore, Junior, Senior|Solon, Ohio|http://www.swagelok.com|58|38
Syensqo|Materials science|Engineering Interns|Sophomore, Junior, Senior|Princeton, New Jersey|https://www.syensqo.com/en/|38|82
The Chemours Company|Chemistry + advanced electronics|Job / Co-op — role not specified|Sophomore, Junior, Senior|Wilmington, Delaware|http://www.chemours.com|55|38
The Great Lakes Construction Co.|Construction|No specific roles listed|Not listed|Hinckley, Ohio|https://greatlakesway.com/our-northeast-ohio-community/|10|25
The Kleingers Group|Civil engineering|Job / Co-op — role not specified|Freshman, Sophomore, Junior, Senior, Alumni|Ohio + regional|http://www.kleingers.com|18|38
The Ruhlin Company|Construction|Summer Internship Program|Freshman, Sophomore, Junior, Senior, Alumni|Sharon Center, Ohio|http://www.ruhlin.com|10|78
Thermo Fisher Scientific|Life sciences technology|Co-op — role not specified|Sophomore, Junior|Multiple locations|https://www.thermofisher.com|68|42
THK Manufacturing of America|Industrial + robotics manufacturing|Project Engineer|Senior|Hebron, Ohio|http://www.thk.com/?q=us/node/5171|45|90
Thorson • Baker + Associates|Building engineering|Mechanical, Electrical and Structural Engineering roles|Sophomore, Junior, Senior, Alumni|Richfield, Ohio|http://www.thorsonbaker.com|25|96
Toyota North America|Automotive + mobility technology|Various Co-op Positions|Not listed|Multiple locations|https://www.toyota.com/careers|72|52
Turner Construction Company|Construction services|Field Engineer; Internship|Freshman, Sophomore, Junior, Senior, Masters|Columbus, Ohio|https://www.turnerconstruction.com/careers|10|90
United Refrigeration Inc.|HVACR distribution|Inside Sales Engineer|Sophomore, Junior, Senior|Philadelphia, Pennsylvania|http://www.uri.com|28|90
Utility Technologies International|Natural gas engineering|Engineering|Junior, Senior|Groveport, Ohio|http://www.uti-corp.com|24|72
V3 Companies|Civil + environmental engineering|Civil Designer I; Intern|Freshman, Sophomore, Junior, Senior, Masters, Alumni|Ohio + regional|http://www.v3co.com|18|90
Vertiv|Digital infrastructure + AI systems|Role details truncated in fair listing|Not listed|Westerville, Ohio|http://www.vertiv.com|92|45
Westlake Corporation|Industrial manufacturing|Industrial R&D Technician|Sophomore, Junior, Senior|Houston, Texas|https://www.westlake.com/|42|90
Whiting-Turner Contracting Company|Construction management|Construction Intern; Entry-Level Engineer|Freshman, Sophomore, Junior, Senior, Alumni|Cleveland, Ohio|http://www.whiting-turner.com|10|94
`.trim()

const roster: RosterEmployer[] = rows.split("\n").map((row) => {
  const [name, industry, role, years, location, website, roleFit, clarity] = row.split("|")
  return { name, industry, role, years, location, website, roleFit: Number(roleFit), clarity: Number(clarity) }
})

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function initials(value: string) {
  return value.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join("").toUpperCase()
}

function getEligibility(years: string): Eligibility {
  if (years === "Not listed") return "verify"
  return years.includes("Sophomore") ? "eligible" : "future"
}

function getLocationScore(location: string) {
  if (/ohio|columbus|cleveland|akron|westerville|cincinnati|aurora|solon|hebron/i.test(location)) return 100
  if (/michigan|indiana|kentucky|west virginia|pennsylvania|minnesota|multiple/i.test(location)) return 70
  return 45
}

function getSignals(item: RosterEmployer) {
  if (item.roleFit >= 90) return ["Java / APIs", "React", "AI research", "Data"]
  if (item.roleFit >= 75) return ["Automation", "Software systems", "Data", "Problem solving"]
  if (item.roleFit >= 55) return ["SkillTape", "Data", "Internal tools", "Technical communication"]
  return ["SkillTape", "Technical communication", "Problem solving"]
}

function getReasons(item: RosterEmployer, eligibility: Eligibility) {
  const eligibilityReason = eligibility === "eligible"
    ? "Sophomore is explicitly included in the fair listing, so this is actionable now."
    : eligibility === "future"
      ? `The listed school years are ${item.years}; treat this as networking, not a primary application stop.`
      : "The fair listing does not specify school years, so confirm sophomore eligibility before investing much time."
  const fitReason = item.roleFit >= 80
    ? "The employer shows a direct software, IT, data, automation, or digital-infrastructure signal."
    : item.roleFit >= 55
      ? "The work is software-adjacent; your best angle is systems, data, automation, or internal tools."
      : "The listed work is outside your main software target, so keep this below stronger technical matches."
  return [
    eligibilityReason,
    fitReason,
    `${item.role} is the opportunity information supplied by the employer; no unlisted role is being assumed.`,
  ]
}

function getQuestions(item: RosterEmployer, eligibility: Eligibility) {
  if (eligibility === "future") return [
    "Your current listing starts above sophomore year. What would make me a strong candidate when I become eligible?",
    "Are there any sophomore-friendly early-talent programs not shown here?",
    "Who should I stay in touch with, and when should I apply for the next cycle?",
  ]
  if (item.roleFit >= 75) return [
    "Which team is the best fit for a sophomore with Java/Spring, React, and applied-AI project experience?",
    "What would an intern or co-op actually ship during the first few weeks?",
    "What should I emphasize when I apply after the fair?",
  ]
  return [
    "Do any teams hire software, data, IT, GIS, automation, or internal-tools interns beyond the roles shown here?",
    "Which opportunities are open to sophomores for the 2027 cycle?",
    "If this booth is not the right fit, which team or recruiter would you recommend I contact?",
  ]
}

export const employers: Employer[] = roster.map((item) => {
  const eligibility = getEligibility(item.years)
  const eligibilityScore = eligibility === "eligible" ? 100 : eligibility === "verify" ? 55 : 5
  const breakdown = [
    { label: "Technical fit", score: item.roleFit, weight: "50%" },
    { label: "Sophomore eligibility", score: eligibilityScore, weight: "30%" },
    { label: "Opportunity clarity", score: item.clarity, weight: "15%" },
    { label: "Location fit", score: getLocationScore(item.location), weight: "5%" },
  ]
  const rawScore = calculateMatchScore(breakdown)
  const score = eligibility === "future" ? Math.min(rawScore, 44)
    : eligibility === "verify" ? Math.round(rawScore * 0.88) : rawScore

  return {
    id: slugify(item.name),
    name: item.name,
    initials: initials(item.name),
    industry: item.industry,
    role: item.role,
    score,
    technicalFit: item.roleFit,
    eligibility,
    eligibilityLabel: eligibility === "eligible" ? "Eligible now" : eligibility === "future" ? "Future target" : "Verify at booth",
    schoolYears: item.years,
    location: item.location,
    website: item.website,
    booth: "Booth not listed",
    accent: eligibility === "eligible" ? "#58f2cf" : eligibility === "future" ? "#ffcb65" : "#75a7ff",
    skills: getSignals(item),
    reasons: getReasons(item, eligibility),
    questions: getQuestions(item, eligibility),
    breakdown,
  }
}).sort((a, b) => b.score - a.score || b.technicalFit - a.technicalFit)
