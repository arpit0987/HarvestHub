/**
 * HarvestHub Agronomic Rotation Engine
 * Evaluates crop sequences across fields and seasons for:
 * 1. Pest & Disease Break Cycles (Family monoculture vs diversity)
 * 2. Nitrogen Balancing (Legumes / N-fixers vs Heavy Feeders)
 * 3. Root Architecture Alternation (Taproots vs Fibrous systems)
 * 4. Winter Cover Crop & Soil Armor
 * 5. Overall Rotation Health Score (0 - 100%) and recommendations
 */

function evaluateRotationSequence(rotations) {
  // rotations: Array of { year, season, crop: { name, botanical_family, nitrogen_demand, root_depth, water_requirement } }
  // Sorted chronologically
  if (!rotations || rotations.length === 0) {
    return {
      score: 100,
      rating: 'No Plan',
      alerts: [],
      positives: ['No crops scheduled yet. Add crops to begin agronomic assessment.'],
      nitrogenBudget: 'Neutral',
      familyDiversityScore: 100,
      summary: 'Empty schedule'
    };
  }

  const sorted = [...rotations].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3, 'Winter': 4 };
    return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
  });

  const alerts = [];
  const positives = [];
  let score = 90; // baseline

  const familyCounts = {};
  const cropCounts = {};

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const crop = curr.crop;
    if (!crop) continue;

    familyCounts[crop.botanical_family] = (familyCounts[crop.botanical_family] || 0) + 1;
    cropCounts[crop.name] = (cropCounts[crop.name] || 0) + 1;

    // Check consecutive crop comparison
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevCrop = prev.crop;

      if (prevCrop) {
        // 1. Same Crop Monoculture (e.g. Corn -> Corn)
        if (prevCrop.name === crop.name) {
          if (crop.nitrogen_demand === 'Heavy Feeder') {
            score -= 25;
            alerts.push({
              level: 'warning',
              category: 'Pest & Soil Risk',
              message: `Consecutive monoculture: ${crop.name} following ${prevCrop.name} (${prev.year} ${prev.season} -> ${curr.year} ${curr.season}). Elevates soil-borne pests (e.g. Rootworm, Nematodes) and severely depletes nitrogen reserves.`
            });
          } else {
            score -= 15;
            alerts.push({
              level: 'caution',
              category: 'Monoculture Risk',
              message: `Repeated crop sequence: ${crop.name} planted consecutively. Breaks pathogen interruption cycle.`
            });
          }
        }
        // 2. Same Botanical Family
        else if (prevCrop.botanical_family === crop.botanical_family) {
          score -= 15;
          alerts.push({
            level: 'caution',
            category: 'Botanical Family Repetition',
            message: `Consecutive crops from same botanical family (${crop.botanical_family}): ${prevCrop.name} -> ${crop.name}. Shares common leaf blights, rusts, and root rot vectors.`
          });
        }

        // 3. Nitrogen Cycling
        if (prevCrop.nitrogen_demand === 'Nitrogen Fixer' && crop.nitrogen_demand === 'Heavy Feeder') {
          score += 15;
          positives.push({
            category: 'Nitrogen Synergy',
            message: `Optimal nutrient cycle: ${prevCrop.name} (Legume/N-Fixer) fixes residual soil nitrogen ahead of ${crop.name} (Heavy Feeder), reducing synthetic fertilizer demands by 35-50 lbs N/ac.`
          });
        } else if (prevCrop.nitrogen_demand === 'Heavy Feeder' && crop.nitrogen_demand === 'Heavy Feeder') {
          score -= 15;
          alerts.push({
            level: 'warning',
            category: 'Nutrient Depletion',
            message: `Back-to-back heavy feeders: ${prevCrop.name} followed by ${crop.name}. Will require substantial supplemental N-P-K and risks micronutrient exhaustion.`
          });
        }

        // 4. Root Architecture Alternation
        if (prevCrop.root_depth && crop.root_depth) {
          const isTaproot = (d) => d.toLowerCase().includes('taproot');
          const isFibrous = (d) => d.toLowerCase().includes('fibrous');

          if ((isTaproot(prevCrop.root_depth) && isFibrous(crop.root_depth)) ||
              (isFibrous(prevCrop.root_depth) && isTaproot(crop.root_depth))) {
            score += 10;
            positives.push({
              category: 'Soil Structure Synergy',
              message: `Beneficial root alternating: ${prevCrop.name} (${prevCrop.root_depth}) followed by ${crop.name} (${crop.root_depth}) optimizes subsoil nutrient scavenging and aeration.`
            });
          }
        }
      }
    }

    // Cover crop bonus
    if (crop.botanical_family.includes('Cover') || crop.name.toLowerCase().includes('clover') || crop.name.toLowerCase().includes('rye')) {
      score += 10;
      positives.push({
        category: 'Soil Armor',
        message: `${crop.name} incorporated in ${curr.year} ${curr.season} provides active root exudates, prevents winter soil erosion, and builds organic matter.`
      });
    }
  }

  // Calculate Family Diversity
  const totalCrops = sorted.length;
  const uniqueFamilies = Object.keys(familyCounts).length;
  const diversityRatio = totalCrops > 1 ? uniqueFamilies / totalCrops : 1;

  if (diversityRatio >= 0.75 && totalCrops >= 3) {
    score += 10;
    positives.push({
      category: 'Biological Diversity',
      message: `High botanical diversity: ${uniqueFamilies} distinct crop families planned across ${totalCrops} seasons, promoting microbial soil health.`
    });
  }

  // Bound score between 10 and 100
  score = Math.max(15, Math.min(100, score));

  let rating = 'Optimal';
  if (score < 60) rating = 'High Risk';
  else if (score < 80) rating = 'Moderate';
  else rating = 'Optimal';

  return {
    score,
    rating,
    totalRotations: sorted.length,
    alerts,
    positives,
    uniqueFamilies,
    familyCounts
  };
}

module.exports = {
  evaluateRotationSequence
};
