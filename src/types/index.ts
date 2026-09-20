export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  photoPath?: string;
};

export type Client = {
  id: string;
  name: string;
  rut?: string;
  contactName?: string;
  contactRole?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  observations?: string;
  archived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStatus = 'active' | 'pending' | 'finished';

export type Project = {
  id: string;
  clientId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  location?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  description?: string;
  status: ProjectStatus;
  observations?: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceType = 'epoxy' | 'pu_cement' | 'roof_waterproofing' | 'corrosion_control';
export type SurveyScope = 'complete' | 'sectors' | 'critical_points';
export type SurfaceCondition = 'good' | 'regular' | 'bad' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SurveyStatus = 'draft' | 'completed';
export type TrafficLevel = 'low' | 'medium' | 'high';
export type YesNo = 'yes' | 'no';
export type YesNoUnknown = 'yes' | 'no' | 'unknown';
export type OperatingTemp = 'ambient' | 'refrigerated' | 'high' | 'variable' | 'unknown';
export type CorrosionLevel = 'none' | 'slight' | 'moderate' | 'severe' | 'undetermined';

export type FloorSurfaceKind = 'floor' | 'baseboard' | 'channel' | 'other';
export type FloorSubstrate = 'concrete' | 'mortar' | 'ceramic' | 'existing_coating' | 'other';
export type RoofKind = 'metal' | 'concrete' | 'membrane' | 'fiber_cement' | 'panel' | 'other';
export type MetalMaterial = 'carbon_steel' | 'galvanized' | 'stainless' | 'aluminum' | 'other' | 'unknown';
export type ProtectionType = 'paint' | 'anticorrosive' | 'galvanized' | 'other' | 'unknown';

export type ExistingCoatingType = 'epoxy' | 'polyurethane' | 'pu_cement' | 'paint' | 'other';
export type CoatingCondition = 'good' | 'worn' | 'deteriorated' | 'detached' | 'very_deteriorated' | 'unknown';

export type FloorProblemType =
  | 'cracks'
  | 'moisture'
  | 'wear'
  | 'detachment'
  | 'unevenness'
  | 'porosity'
  | 'damaged_joints'
  | 'oil_grease'
  | 'chemical_contamination'
  | 'impacts'
  | 'deteriorated_coating'
  | 'other';

export type RoofProblemType =
  | 'leaks'
  | 'moisture'
  | 'corrosion'
  | 'perforations'
  | 'damaged_seals'
  | 'cracks'
  | 'membrane_detached'
  | 'damaged_overlaps'
  | 'damaged_fasteners'
  | 'water_ponding'
  | 'deformations'
  | 'other';

export type CorrosionProblemType =
  | 'surface_rust'
  | 'general_corrosion'
  | 'localized_corrosion'
  | 'coating_detached'
  | 'blistered_paint'
  | 'flaking_paint'
  | 'exposed_metal'
  | 'permanent_moisture'
  | 'chemical_attack'
  | 'joint_corrosion'
  | 'weld_corrosion'
  | 'other';

export type ProblemType = FloorProblemType | RoofProblemType | CorrosionProblemType;

export type AreaUseType =
  | 'pedestrian'
  | 'pallet_jacks'
  | 'forklift'
  | 'vehicles'
  | 'machinery'
  | 'production'
  | 'warehouse'
  | 'dispatch'
  | 'other';

export type ExposureType =
  | 'water'
  | 'oils'
  | 'greases'
  | 'chemicals'
  | 'abrasion'
  | 'severe_abrasion'
  | 'impacts'
  | 'moisture'
  | 'frequent_wash'
  | 'pressure_wash'
  | 'hot_water'
  | 'permanent_moisture'
  | 'thermal_shock'
  | 'dry_interior'
  | 'exterior'
  | 'frequent_moisture'
  | 'marine'
  | 'industrial'
  | 'high_temp'
  | 'condensation'
  | 'other';

export type FloorElementType = 'floor' | 'baseboard' | 'channel' | 'other';

export type RoofElementType =
  | 'gutter'
  | 'downspout'
  | 'overlap'
  | 'seal'
  | 'fastener'
  | 'junction'
  | 'skylight'
  | 'penetration'
  | 'edge'
  | 'ridge'
  | 'other';

export type CorrosionElementType =
  | 'steel_structure'
  | 'beam'
  | 'column'
  | 'walkway'
  | 'platform'
  | 'stair'
  | 'railing'
  | 'pipe'
  | 'tank'
  | 'support'
  | 'equipment'
  | 'other';

export type ElementType = FloorElementType | RoofElementType | CorrosionElementType;

export type PhotoCategory =
  | 'overview'
  | 'crack'
  | 'joint'
  | 'moisture'
  | 'detachment'
  | 'contamination'
  | 'leak'
  | 'corrosion'
  | 'seal'
  | 'overlap'
  | 'gutter'
  | 'perforation'
  | 'coating'
  | 'weld'
  | 'detail'
  | 'other';

export type PhotoUploadStatus = 'pending' | 'uploading' | 'ready' | 'error';

export type PhotoEvidence = {
  id: string;
  uri: string;
  storagePath?: string;
  uploadStatus?: PhotoUploadStatus;
  surveyId: string;
  sectorId?: string;
  elementId?: string;
  category?: PhotoCategory;
  caption?: string;
  createdAt: string;
};

export type SurveyElement = {
  id: string;
  surveyId: string;
  sectorId: string;
  elementType: ElementType;
  reference?: string;
  material?: MetalMaterial;
  condition: SurfaceCondition;
  corrosionLevel?: CorrosionLevel;
  problems: ProblemType[];
  otherProblem?: string;
  exposures: ExposureType[];
  observations?: string;
  severity: Severity;
  photos: PhotoEvidence[];
  createdAt: string;
  updatedAt: string;
};

export type SurveySector = {
  id: string;
  surveyId: string;
  name: string;
  approximateArea?: number;
  condition: SurfaceCondition;
  severity: Severity;
  problems: ProblemType[];
  otherProblem?: string;
  uses: AreaUseType[];
  otherUse?: string;
  trafficLevel?: TrafficLevel;
  exposures: ExposureType[];
  observations?: string;
  recommendation?: string;
  photos: PhotoEvidence[];
  elements: SurveyElement[];
  createdAt: string;
  updatedAt: string;
};

export type FloorServiceData = {
  type: 'epoxy' | 'pu_cement';
  surfaceKind?: FloorSurfaceKind;
  otherSurfaceKind?: string;
  substrate?: FloorSubstrate;
  otherSubstrate?: string;
  totalArea?: number;
  existingCoating?: YesNoUnknown;
  existingCoatingType?: ExistingCoatingType;
  otherExistingCoating?: string;
  existingCoatingCondition?: CoatingCondition;
  problems: ProblemType[];
  otherProblem?: string;
  uses: AreaUseType[];
  otherUse?: string;
  exposures: ExposureType[];
  operatingTemp?: OperatingTemp;
  approxTempC?: number;
};

export type RoofServiceData = {
  type: 'roof_waterproofing';
  roofKind?: RoofKind;
  otherRoofKind?: string;
  totalArea?: number;
  problems: ProblemType[];
  otherProblem?: string;
};

export type CorrosionServiceData = {
  type: 'corrosion_control';
  existingProtection?: YesNoUnknown;
  protectionType?: ProtectionType;
  otherProtection?: string;
  protectionCondition?: CoatingCondition;
  exposures: ExposureType[];
};

export type ServiceSpecificData = FloorServiceData | RoofServiceData | CorrosionServiceData;

export type Survey = {
  id: string;
  code: string;
  projectId: string;
  userId: string;
  serviceType: ServiceType;
  status: SurveyStatus;
  scope?: SurveyScope;
  overallCondition?: SurfaceCondition;
  visitReason?: string;
  generalObservations?: string;
  conclusion?: string;
  plantOperational?: YesNo;
  scheduleRestrictions?: YesNo;
  accessNotes?: string;
  machineryToRemove?: YesNo;
  siteComments?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  serviceData: ServiceSpecificData;
  sectors: SurveySector[];
  photos: PhotoEvidence[];
};

export type ClientDraft = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'archivedAt'>;
export type ProjectDraft = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type ClientProjectSetup = {
  clientId?: string;
  client?: ClientDraft;
  project: Omit<ProjectDraft, 'clientId'>;
};
