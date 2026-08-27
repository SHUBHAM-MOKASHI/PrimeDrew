import { analyzeVehicleDamageAI, runDynamicDamageInference } from './damageDetectionService';

export { analyzeVehicleDamageAI, runDynamicDamageInference };

/**
 * Universal dynamic damage inference forwarding proxy
 */
export const detectVehicleDamage = async (arg1, arg2, arg3) => {
  if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    const res = await analyzeVehicleDamageAI(arg1, arg2, arg3 || 'rear');
    return res.detections;
  }
  return [];
};

export default {
  analyzeVehicleDamageAI,
  runDynamicDamageInference,
  detectVehicleDamage
};
