export interface Pipe {
  /** The unique identifier for the pipe. */
  id: number;
  /** A free text description of the pipe. */
  description?: string;
  /** The outer diameter of the pipe, in millimeters. */
  diameter?: number;
  /** The primary material of construction (e.g., 'Carbon Steel', 'PVC'). */
  material?: string;
  /** The length of the pipe section, in meters. */
  length?: number;
  /** The maximum internal pressure the pipe can withstand, in PSI. */
  pressureRating?: number;
  /** The pipe schedule, indicating wall thickness (e.g., 'SCH 40'). */
  schedule?: string;
  /** The specific grade of the material (e.g., 'A106-B', '316L'). */
  materialGrade?: string;
  /** The ultimate tensile strength of the material, in Megapascals (MPa). */
  tensileStrength?: number;
  /** The stress at which the material begins to deform plastically, in Megapascals (MPa). */
  yieldStrength?: number;
  /** The material hardness on a common scale (e.g., '150 HB' for Brinell). */
  hardness?: string;
  /** The resistance of the pipe to crushing forces, in kilonewtons per meter (kN/m). */
  ringCrushStrength?: number;
  /** The type of external or internal coating (e.g., 'FBE', 'Galvanized'). */
  coating?: string;
  /** The thickness of any applied insulation, in millimeters. */
  insulationThickness?: number;

  corrosionLevel?: number;
  isJacketed?: boolean;
  isFlanged?: boolean;
}
