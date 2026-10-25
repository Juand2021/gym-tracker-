# Estimating Energy Expenditure (TDEE) and Body Fat Without Lab Equipment

Research notes for an app designer. Target user example: male, 25 y, 179 cm, sedentary office job, 3,000–4,000 steps/day, resistance training 4+ days/week for about 90 min, higher body fat but not overweight, takes creatine, just finished a bulk. Researched October 2026. Several PubMed abstract pages could not be fetched (cookie wall). Where an exact number could not be confirmed, it is listed under Gaps.

## 1. Accuracy of resting metabolic rate (RMR) equations and when to use each

### Takeaway
Mifflin-St Jeor (1990) is the best-supported default for the general population when body-fat % is unknown (Frankenfield 2005). In resistance-trained or athletic men, weight-based general equations tend to *underestimate* RMR. Athlete-derived equations (Ten Haaf 2014, Tinsley 2019) or FFM-based equations (Cunningham) do better, but only when body-fat % is reasonably accurate. Expect errors of about ±10% or more for individuals with any equation.

### Cited Findings
- Frankenfield, Roth-Yousey & Compher (2005), *J Am Diet Assoc* 105:775–789, systematic review of RMR equations in healthy nonobese and obese adults. It found Mifflin-St Jeor the most reliable of the four common equations (Harris-Benedict, Mifflin-St Jeor, Owen, WHO/FAO/UNU), most likely to predict within 10% of measured RMR and with the narrowest error range. Individual errors remain meaningful, and older adults and US ethnic minorities were underrepresented — [Penn State Pure record](https://pure.psu.edu/en/publications/comparison-of-predictive-equations-for-resting-metabolic-rate-in-/); [Academy EAL summary](https://www.andeal.org/topic.cfm?cat=3061)
- In an independent study of 125 healthy women (BMI 17–44), Mifflin-St Jeor predicted within ±10% of measured RMR in about 71% of participants. Accuracy at the individual level was described as low. This is not the Frankenfield figure — [PMC7299486](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7299486/)
- Harris-Benedict within-10% accuracy in obese-adult studies ranged widely, from about 13% to 64% depending on study quality — [PMC7299486 / search summary](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7299486/)
- O'Neill, Corish & Horner (2023), *Sports Medicine* 53(12):2373–2398, systematic review and meta-analysis in athletes: 29 studies, 1,430 participants, 100 equations — [PMC10687135](https://pmc.ncbi.nlm.nih.gov/articles/PMC10687135/)
  - Ten Haaf (2014), which uses weight, height and age, was the most accurate overall. ES 0.04 with no heterogeneity; updated mean difference −2.6 kcal/24 h (95% CI −29.6 to 24.4). About 85% of males fell within ±10% with the weight version and about 83% with the FFM version.
  - Harris-Benedict underestimated RMR in male athletes (ES −0.53), with the underestimation trending larger above about 78.9 kg. One included study found Harris-Benedict about 500 kcal too low in elite rowers and canoeists.
  - Mifflin-St Jeor showed significant bias in athletes, with only 52.2% of predictions within ±10%. Owen reached 41.2% overall (46.1% in males).
  - Cunningham (1980, LBM): ES 0.15, not significant overall.
  - FFM-based equations were **not** shown to be systematically better than weight-based ones. The authors recommend choosing an equation derived from a population similar to the user (sex, body size, athlete status).
  - Tinsley 2019 was not included in the pooled analysis.
- Tinsley, Graybeal & Moore (2019), muscular physique athletes (n = 27: 17 M, 10 F). Nearly all existing weight- and FFM-based equations lacked acceptable validity and typically **underestimated** RMR. New equations, built by stepwise regression and checked with leave-one-out cross-validation: **RMR = 25.9 × FFM(kg) + 284** and **RMR = 24.8 × BW(kg) + 10** — [TTU Scholars record](https://scholars.ttu.edu/en/publications/resting-metabolic-rate-in-muscular-physique-athletes-validity-of--5)
- In a 2024 *JISSN* study of 30 resistance-trained men, RMR from the Tinsley FFM equation using BIA-derived FFM agreed with DXA-derived FFM (no significant difference; r = 0.89). Consumer-style BIA FFM may therefore be usable as an input — [PMC11216238](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11216238/)
- Mifflin-St Jeor formula (kcal/day; weight in kg, height in cm, age in y): **Men = 10W + 6.25H − 5A + 5; Women = 10W + 6.25H − 5A − 161** — [QxMD Mifflin-St Jeor calculator (cites Frankenfield 2005)](https://calculate.qxmd.com/storage/calculators/846/Mifflin-StJeorEquation.html)
- FAO/WHO/UNU (2001/2004) Schofield BMR equations, weight in kg: **Men 18–30 y = 15.057W + 692.2; Men 30–60 y = 11.472W + 873.1** — [FAO Human Energy Requirements, ch. 5](https://www.fao.org/4/y5686e/y5686e07.htm)

### Formulas for reference (standard published forms; primary sources not fetched in this session, so verify before shipping)
- Harris-Benedict, original 1918/1919 (men): 66.47 + 13.75W + 5.003H − 6.755A
- Harris-Benedict, revised by Roza & Shizgal 1984 (men): 88.362 + 13.397W + 4.799H − 5.677A; (women): 447.593 + 9.247W + 3.098H − 4.330A
- Katch-McArdle: 370 + 21.6 × LBM(kg)
- Cunningham (1980): 500 + 22 × LBM(kg)
- Ten Haaf (2014), weight version: 11.936W + 587.728H(m) − 8.129A + 191.027(sex: M = 1, F = 0) + 29.279, result in kcal. The coefficients are from memory and the paper was not retrieved, so this must be verified.

### Inferences
- Worked example for the target user. Weight was not given; 78 kg is assumed and BF 22% gives FFM about 60.8 kg. Mifflin = 10·78 + 6.25·179 − 125 + 5 ≈ **1,779 kcal**. Schofield ≈ 1,867. Tinsley BW ≈ 1,944. With FFM: Tinsley FFM ≈ 1,859, Cunningham ≈ 1,838, Katch-McArdle ≈ 1,683. The spread is about 260 kcal/day (~15%), which matches the reported individual error.
- Suggested app logic:
  - No BF%: use Mifflin-St Jeor. If the user self-identifies as a resistance-trained lifter, optionally show Ten Haaf, or average Mifflin with Tinsley-BW, because general equations underestimate in muscular men.
  - Reliable BF% (DXA/BIA/Navy): use Tinsley-FFM or Cunningham.
  - Treat every RMR estimate as a **prior** that the adaptive algorithm (section 3) overrides.
- Since FFM-based equations are not clearly superior and depend on a noisy BF% estimate (±3–6 percentage points from tape methods), body fat should stay optional and affect the starting estimate only modestly.

### Gaps
- Exact Frankenfield 2005 subgroup percentages within ±10% (often quoted as about 82% nonobese and 70% obese for Mifflin) and mean error figures could not be confirmed: PubMed was blocked and the full text is paywalled.
- The Tinsley 2019 journal (believed to be *IJSNEM*) and its exact error statistics were not confirmed.
- The Harris-Benedict, Katch-McArdle, Cunningham and Ten Haaf coefficients above were not checked against primary sources in this session.

## 2. Activity multipliers (PAL), NEAT and steps, resistance-training energy cost

### Takeaway
FAO/WHO/UNU defines PAL = TEE/BMR. A sedentary or light lifestyle is PAL 1.40–1.69, so a desk worker at 3–4k steps sits near the bottom (about 1.4–1.5). Measured cost of a resistance session is roughly 4–5 kcal/min gross. A 90-minute session with long rests likely nets only about 250–400 kcal above rest. Multipliers are coarse, and baseline TEE for a free-living person is only known to about ±5% at best, so treat the result as a starting point.

### Cited Findings
- FAO/WHO/UNU 2004 (2001 consultation): PAL = TEE/BMR. **Sedentary/light 1.40–1.69; active/moderately active 1.70–1.99; vigorous 2.00–2.40.** PAL above about 2.40 is hard to sustain long-term — [FAO Human Energy Requirements, ch. 5](https://www.fao.org/4/y5686e/y5686e07.htm)
- In 18 overweight women measured by indirect calorimetry, a BodyPump session cost about 302 kcal and a heavy-load resistance session about 289 kcal (about 4.7 kcal/min). RMR stayed 15–22% above baseline 2 h after exercise — [PMC7298122](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7298122/)
- Wearables underestimated circuit resistance-training expenditure against indirect calorimetry. In free-weight circuits the gap was 81.4% for ActiTrainer and 24.9% for SenseWear (n = 6) — [PMC9042340](https://pmc.ncbi.nlm.nih.gov/articles/PMC9042340)
- Free-living baseline energy expenditure is known to only about 5% precision. In Hall's 100 kg example, that alone causes about ±4 kg of uncertainty in predicted weight change over years — [Hall et al. 2011, PMC3880593](https://pmc.ncbi.nlm.nih.gov/articles/PMC3880593)

### Inferences
- Recommended "factorial" build for the app, which is more transparent than a single multiplier:
  - TDEE ≈ RMR × 1.40 (sedentary base PAL, which already includes TEF and minimal daily movement)
  - + extra steps × ~0.04 kcal/step (body-weight dependent, about 0.5 kcal/kg/km) for steps above roughly 5,000. This is an inference, not a sourced coefficient.
  - + training energy averaged per day: sessions/week × net kcal/session ÷ 7. Net ≈ (4–5 kcal/min × active minutes) − RMR/min over the same time.
- Target user: about 1,780–1,940 × 1.40 ≈ 2,490–2,720. Add training at 4.5 sessions × ~300 kcal net ÷ 7 ≈ +190. Steps add essentially nothing beyond the base. Result: **about 2,700–2,900 kcal/day**. This is equivalent to an effective PAL of about 1.5, which the FAO tables place at the low end of "sedentary/light" even with heavy lifting.
- 90 min of lifting is not 90 min of work: rest intervals dominate. Do not let users enter "90 min × 8 kcal/min".
- Do not use smartwatch calorie numbers for lifting as ground truth, because their bias can be large in either direction.

### Gaps
- No pooled meta-analytic kcal/min value for resistance training was retrieved; a 2024 *Sports Medicine* review exists but only its supplement was seen.
- No peer-reviewed per-step kcal coefficient was retrieved.

## 3. Adaptive TDEE: back-calculating expenditure from intake and the weight trend

### Takeaway
The robust approach is to estimate TDEE from (mean logged intake) − (change in tissue energy stores)/days, using a smoothed weight trend over at least 2–4 weeks. The static 3,500 kcal/lb (7,700 kcal/kg) rule works for short-window back-calculation. It is wrong for long-term forecasting, because expenditure falls as weight changes. Hall's model gives an eventual change of about 1 kg per 100 kJ/day (24 kcal/day) of sustained intake change, half-time about 1 year. Underreporting of intake is common (about 20–40%), but the adaptive method largely absorbs a *consistent* logging bias.

### Cited Findings
- Hall et al. (2011), *Lancet* 378(9793):826–837 — [PMC3880593](https://pmc.ncbi.nlm.nih.gov/articles/PMC3880593)
  - The static 3,500 kcal/lb rule ignores falling expenditure. For a 2 MJ/day cut it predicts about 22 kg loss in year 1, roughly double the dynamic model's estimate.
  - Rule of thumb: every permanent 100 kJ/day (about 24 kcal/day) change in intake gives an eventual change of about 1 kg (about 10 kcal/day per lb). About 50% of the change happens in about 1 year and about 95% in about 3 years.
  - Fat stores about 39.5 MJ/kg (~9,440 kcal/kg) and lean tissue about 7.6 MJ/kg (~1,816 kcal/kg). Losing a kg of fat therefore needs about 5× the deficit of losing a kg of lean tissue.
  - Plateaus at 6–8 months are better explained by declining adherence than by metabolic slowdown alone.
  - Self-reported intake is unreliable. The model can use longitudinal body weight to infer intake changes.
- The NIH NIDDK Body Weight Planner implements this model; NIDDK hosts the full model equations — [NIDDK Body Weight Planner research page](https://www.niddk.nih.gov/research-funding/at-niddk/labs-branches/laboratory-biological-modeling/integrative-physiology-section/research/body-weight-planner)
- The Hacker's Diet (John Walker) uses an exponentially smoothed moving average with a smoothing constant of 0.9, roughly equivalent to a 20-day moving average (the new reading gets weight 0.1). Daily fluctuation is dominated by water and gut contents, for example extra water held after salty food. Calorie balance = trend slope (lb/week) × 3,500 ÷ 7; worked example: 1.7 lb/week ≈ 850 kcal/day deficit. A fitted regression line is slightly more accurate than comparing start and end values. The trend lags the real change slightly — [Hacker's Diet, "Signal and Noise"](https://www.fourmilab.ch/hackdiet/e4/signalnoise.html)
- Underreporting:
  - NHANES 2009–2018, using a DLW-derived predictive equation: about 23% of US adults underreported, about 39% on low-calorie diets and about 44% on carbohydrate-restrictive diets — [PMC12538426](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12538426/)
  - Weighed records came to about 81–82% of measured expenditure in general adults and 64–73% in obese women. Underreporting rises with BMI — [Nature EJCN PDF](https://www.nature.com/articles/1601249.pdf); [Cambridge BJN, African diaspora](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/468C2E12A0EF0934D1706FF18715E928/S000711451400405Xa.pdf/under-reporting-of-dietary-energy-intake-in-five-populations-of-the-african-diaspora.pdf)

### Inferences
- Algorithm sketch:
  1. trend_t = trend_{t−1} + α·(w_t − trend_{t−1}), with α ≈ 0.1 (Hacker's Diet). An α of 0.1–0.15 is a reasonable default. Skip missing days rather than imputing them.
  2. Over a window of N days (minimum 14, ideally 21–28): slope = linear-regression slope of trend (kg/day).
  3. TDEE_obs = mean_intake − slope × ρ, where ρ is the tissue energy density. Use 7,700 kcal/kg as a simple default. Optionally make ρ composition-aware (about 9,440 kcal/kg for fat and about 1,816 kcal/kg for lean, per Hall) depending on phase. For a lifter in a slow surplus, a mix of roughly 50/50 fat/lean (ρ ≈ 5,600) may be more realistic; this split is an inference.
  4. Blend with the formula prior (Bayesian or Kalman-style): weight the observed estimate more as N and logging completeness grow, for example w = min(1, logged_days/28).
  5. Clamp weekly TDEE changes (for example ±100–150 kcal/week) to avoid chasing noise.
- Why this handles underreporting: if a user consistently underlogs by 20%, the back-calculated "TDEE" falls by the same amount. Targets set in the same logged-kcal units will still produce the intended weight change. Users should be told the number is "your TDEE as measured by your logging", not lab TDEE. *Inconsistent* logging, such as skipped days or weekends, is the real problem. Exclude days marked incomplete instead of counting them as low intake.
- For forecasts beyond about 8–12 weeks, use a Hall-style dynamic adjustment (expenditure falls about 24 kcal/day per kg lost) rather than linear 7,700 kcal/kg extrapolation.

### Gaps
- No peer-reviewed validation of app-style adaptive TDEE algorithms (as used by MacroFactor and similar apps) was found.
- The Hall model equation PDF was not opened.

## 4. Metabolic adaptation in a deficit

### Takeaway
Expenditure falls more than tissue loss alone predicts. Reported adaptive components range from about 79 to about 504 kcal/day in overweight populations, and severe prolonged restriction produced about 15% adaptation beyond mass loss. Contributors include lower NEAT, lower leptin, T3 and testosterone, and higher ghrelin and cortisol. For a moderate cut from a normal-weight bulk, the effect is real but usually modest and mostly NEAT-driven, and the adaptive algorithm will capture it.

### Cited Findings
- Trexler, Smith-Ryan & Norton (2014), *JISSN* 11:7, "Metabolic adaptation to weight loss: implications for the athlete" — [PMC3943438](https://pmc.ncbi.nlm.nih.gov/articles/PMC3943438/)
  - TDEE falls beyond what loss of body mass predicts, and NEAT decreases with an energy deficit. Spontaneous physical activity may stay suppressed after returning to ad libitum feeding (Biosphere 2).
  - Hormones: leptin, insulin, testosterone and T3 fall; ghrelin and cortisol rise. TEF is about 10% of TDEE and does not change much proportionally.
  - Overfeeding/refeed: Dirlewanger et al. found about a 7% (~138 kcal/day) TDEE rise, 36 kcal of it from carbohydrate TEF.
  - Mitigation: use the smallest deficit that produces meaningful loss, resistance training, and high protein. Refeeds and reverse dieting are common practice, but evidence was described as limited or anecdotal.
- Helms, Aragon & Fitschen (2014), *JISSN*, evidence-based recommendations for natural bodybuilding contest prep — [PMC4033492](https://pmc.ncbi.nlm.nih.gov/articles/PMC4033492/)
  - Overweight populations: adaptive reductions beyond prediction of about 79 to about 504 kcal/day.
  - Non-overweight men at 50% of maintenance for 24 weeks (Minnesota study), losing about 25% of body mass: about 40% drop in expenditure, of which about 25 points came from mass loss and about 15 from adaptation.
  - Case study of a natural bodybuilder: testosterone fell to about a quarter of baseline by month 3 of a 6-month prep, then recovered.

### Inferences
- The app should not hard-code an "adaptation penalty". It should let the adaptive TDEE track it and show plateau messages. Per Hall, check adherence first.
- Defaults to show for a lean or moderately fat lifter cutting: about 0.5–1.0% of body weight per week, protein high, keep training volume.

### Gaps
- No magnitude was found for adaptation specifically in short (8–16 week) moderate cuts in non-obese lifters.
- The Biggest Loser follow-up (Fothergill 2016) was not retrieved.

## 5. Water-weight confounders: glycogen, sodium, alcohol, creatine

### Takeaway
Early-diet scale drops and post-refeed or sodium spikes are largely water. Each gram of glycogen is stored with at least 3 g of water. Creatine loading adds about 0.5–1.4 L of mostly intracellular water. An app should smooth with an EMA, discount the first 1–2 weeks of any phase change, and let users flag events (creatine start, high-sodium or alcohol day, refeed) so those days are down-weighted.

### Cited Findings
- Fernández-Elías et al. (2015), *Eur J Appl Physiol*: at least 3 g of water is stored per g of muscle glycogen (ratio 1:3 with restricted water), up to about 1:17 with full rehydration. The higher ratio likely reflects water not bound to glycogen. The sample was 9 trained cyclists — [doi:10.1007/s00421-015-3175-z](https://dx.doi.org/10.1007/s00421-015-3175-z)
- ISSN position stand on creatine (Kreider et al. 2017): creatine is osmotic, and early loading studies showed short-term fluid retention of about 0.5–1.0 L, proportional to the acute weight gain. Weight gain is the only consistently reported side effect. Loading: 5 g × 4/day (about 0.3 g/kg/day) for 5–7 days, then 3–5 g/day. Alternative: 3 g/day for 28 days — [PMC5469049](https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/)
- Training studies over 5–10 weeks with load-then-maintain protocols did not consistently show increased total, intracellular or extracellular body water. A 7-day, 25 g/day loading study reported about 1.37 L of total body water gain, about 1.13 L intracellular (secondhand summary citing Powers et al.) — [sci-sport.com summary](https://sci-sport.com/en/creatine-and-its-myths-what-does-science-have-to-say-243/); [J3 University summary](https://j3university.com/peak-week-creatine-enhancing-the-carb-load/)
- Salty food makes the body retain extra water, and water dominates daily scale fluctuation — [Hacker's Diet](https://www.fourmilab.ch/hackdiet/e4/signalnoise.html)

### Inferences
- Target user already takes creatine at steady state, so the extra water is a constant offset that does not bias the trend. The confounder matters only when starting or stopping creatine; stopping may show about 0.5–1.5 kg of "loss" over a few weeks.
- Starting a cut right after a bulk: the lower carbohydrate intake will deplete some glycogen. Assuming roughly 300–500 g whole-body glycogen and 3–4 g water per g, expect about 1–2 kg of rapid early loss. This is an inference; the glycogen pool size was not sourced. The app should exclude or down-weight the first 7–14 days when back-calculating TDEE after a phase change, or it will overestimate TDEE.
- Sodium and alcohol days: allow tags and apply lower weight in the regression rather than deleting data.
- If a user measures BF by BIA, creatine and glycogen-related water shifts can move BIA readings; prefer tape-based trend methods for tracking.

### Gaps
- No peer-reviewed quantification was retrieved for alcohol-related or sodium-related acute scale changes.
- The primary Powers et al. study on creatine and body water was not fetched.

## 6. Body-fat estimation without lab tools

### Takeaway
Use waist-based measures (waist-to-height ratio, RFM, US Navy) rather than BMI for lifters. Expect individual errors of about ±3–6 percentage points versus DXA, with systematic bias: lean men are overestimated and fatter people underestimated. Body fat should stay optional. The app can always show waist-to-height ratio (needs only a tape measure) and, optionally, RFM or Navy %BF as a trend, never as a precise value.

### Cited Findings
- US Navy circumference method, Hodgdon & Beckett (1984, Naval Health Research Center): cross-validated in 100 Navy men against underwater weighing, r = 0.90, standard error 2.70 %BF units — [DTIC ADA143890](https://apps.dtic.mil/sti/pdfs/ADA143890.pdf)
- Navy-type circumference methods compared with DXA:
  - Fit male Marines: %BF underestimated (bias −2.6 ± 3.7 and −2.5 ± 3.7 points by age group). Lean people were overestimated and high-%BF people underestimated — [Frontiers in Physiology 2022](https://frontiersin.org/articles/10.3389/fphys.2022.868627/full)
  - Army recruits before basic training: underestimation of −6.0 ± 3.5% in men and −6.0 ± 4.4% in women — [Frontiers in Physiology 2023, PMC10282178](https://pmc.ncbi.nlm.nih.gov/articles/PMC10282178)
  - Latour et al. (2019): DXA would raise male %BF estimates relative to the Navy method — [Cedarville Digital Commons](https://digitalcommons.cedarville.edu/kinesiology_and_allied_health_publications/72)
- Relative Fat Mass, Woolcott & Bergman (2018), *Scientific Reports*: derived on NHANES 1999–2004 (n = 12,581) and validated on 2005–2006 (n = 3,456) against DXA. **RFM = 64 − 20 × (height/waist) for men; 76 − 20 × (height/waist) for women**, same units for both. RFM predicted DXA %BF better than BMI and gave fewer false negatives for obesity — [Woolcott 2018 Sci Rep (MitoFit/Bioblast summary)](https://wiki.oroboros.at/index.php/Woolcott_2018_Sci_Rep); [Cedars-Sinai press release via Newswise](https://www.newswise.com/articles/cedars-sinai-investigators-develop-more-accurate-measure-of-body-fat)
- External validation in 61 young Mexican adults: RFM predicted %BF better than BMI against DXA and other methods. Small, narrow-age sample — [PLoS ONE 2019 (DOAJ)](https://doaj.org/article/eeeb5bd9cb2e478098c7bf8d6b979489)
- NICE NG246 (2022/2025): waist-to-height ratio **0.40–0.49 = healthy; 0.50–0.59 = increased risk; ≥0.60 = high risk**. Usable for both sexes and all ethnicities with BMI under 35, **explicitly including adults with high muscle mass**. Public message: keep your waist under half your height — [NICE NG246](https://www.nice.org.uk/guidance/NG246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity)

### Formula for reference (standard published form; DTIC full text not parsed in this session, so verify)
- US Navy, men, inches: %BF = 86.010 × log10(abdomen − neck) − 70.041 × log10(height) + 36.76
- US Navy, women, inches: %BF = 163.205 × log10(waist + hip − neck) − 97.684 × log10(height) − 78.387
- Metric (cm) variants circulate, for example men: 495 / (1.0324 − 0.19077·log10(waist − neck) + 0.15456·log10(height)) − 450.

### Inferences
- Target user example: 179 cm with an 88 cm waist gives WHtR 0.49 (borderline healthy) and RFM = 64 − 20 × 179/88 ≈ 23.3%. This illustrates the "higher BF but BMI-normal" profile that BMI misses.
- BMI limitations in lifters: NICE's explicit endorsement of WHtR for high-muscle-mass adults is the authoritative basis for showing WHtR over BMI.
- Recommended app approach:
  1. Ask for waist (at the navel, relaxed, morning) and, optionally, neck.
  2. Always display WHtR with the NICE bands.
  3. Display RFM by default (one tape measurement) and Navy %BF if neck is provided. Label both as ±4–6 points.
  4. Accept a user-entered DXA or BIA value as an override.
  5. Use body fat only to choose the RMR equation (section 1) and to suggest cut vs bulk. Do not use it to compute precise targets.
  6. Track the waist trend every 2–4 weeks; it is more actionable than %BF.
- Visual estimation (photo charts) is likely ±5+ points and subjective. It could be offered as a "rough range" picker, but no validation data was retrieved.

### Gaps
- No validated error statistics were found for visual or photo-based BF estimation.
- The RFM error versus DXA in resistance-trained men specifically was not found.

## 7. Pseudogynecomastia vs gynecomastia and when to see a doctor

### Takeaway
Pseudogynecomastia is soft fatty tissue in the chest, common after a bulk or at higher body fat, and it responds to fat loss. True gynecomastia is glandular tissue: a firm or rubbery disc directly under the areola, which can be present even in lean men. A clinician's exam distinguishes them. See a GP for pain, a lump, skin or nipple changes, discharge, or concern. Anabolic steroid use and some medicines are known causes.

### Cited Findings
- AAFP (*American Family Physician*, 2017): pseudogynecomastia is increased breast adipose tissue, to be considered in obese males. It is distinguished on physical exam by soft adipose tissue rather than glandular breast tissue — [AAFP 2017;95(9):583 PDF](https://www.aafp.org/pubs/afp/issues/2017/0501/p583.pdf)
- Exam technique (secondary teaching slide deck): with the patient supine and thumb and forefinger on either side, gynecomastia feels like a concentric, rubbery-to-firm, often mobile disc directly beneath the areola; pseudogynecomastia has no discrete mass — [SlideShare teaching deck](https://www.slideshare.net/slideshow/gynecomastia-final-250298212/250298212)
- NHS: gynaecomastia is common and often harmless. Causes include hormone changes (puberty, over 50), being overweight, certain medicines, hyperthyroidism, kidney disease, cirrhosis, and drugs including anabolic steroids. **See a GP** if worried about size or appearance, or with persistent breast or nipple pain, a lump, skin changes (rash, dimpling, redness), or nipple discharge or bleeding. Treatments include weight loss if overweight, hormone-modulating medicines, treating the cause, and surgery (often not on the NHS) — [NHS Gynaecomastia](https://www.nhs.uk/conditions/gynaecomastia/)

### Inferences
- App copy: show a neutral info card when the user mentions chest fat. It should say that chest fat usually reduces with overall fat loss, describe the firm-disc sign, and list the NHS reasons to see a GP. Do not attempt diagnosis.
- For a creatine user: creatine is not listed as a cause in these sources. Anabolic steroids are.

### Gaps
- The Mayo Clinic page returned 403 and the Cleveland Clinic page returned 404, so neither could be used.
- No prevalence figures were retrieved.
