export type User = {
  id: string;
  name: string;
  email: string;
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

export type SurfaceType = 'floor' | 'roof';
export type SurveyScope = 'complete' | 'sectors' | 'critical_points';
export type SurfaceCondition = 'good' | 'regular' | 'bad' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SurveyStatus = 'draft' | 'completed';
export type TrafficLevel = 'low' | 'medium' | 'high';
export type YesNo = 'yes' | 'no';
export type YesNoUnknown = 'yes' | 'no' | 'unknown';
export type MoisturePresence = 'yes' | 'no' | 'undetermined';

export type FloorSubstrate = 'concrete' | 'mortar' | 'ceramic' | 'tile' | 'existing_coating' | 'other';
export type RoofSubstrate = 'concrete' | 'metal' | 'membrane' | 'fiber_cement' | 'other';
export type SubstrateType = FloorSubstrate | RoofSubstrate;

export type ExistingCoatingType =
  | 'epoxy'
  | 'polyurethane'
  | 'pu_cement'
  | 'paint'
  | 'ceramic'
  | 'membrane'
  | 'other';

export type CoatingCondition =
  | 'good'
  | 'worn'
  | 'deteriorated'
  | 'partially_detached'
  | 'very_deteriorated'
  | 'unknown';

export type FloorProblemType =
  | 'cracks'
  | 'moisture'
  | 'wear'
  | 'detachment'
  | 'unevenness'
  | 'porosity'
  | 'contamination'
  | 'oil_grease'
  | 'damaged_joints'
  | 'impacts'
  | 'deteriorated_coating'
  | 'other';

export type RoofProblemType =
  | 'leaks'
  | 'moisture'
  | 'corrosion'
  | 'damaged_seals'
  | 'cracks'
  | 'detachments'
  | 'damaged_joints'
  | 'water_ponding'
  | 'perforations'
  | 'other';

export type ProblemType = FloorProblemType | RoofProblemType;

export type ContaminationType =
  | 'oil'
  | 'grease'
  | 'chemicals'
  | 'detergents'
  | 'dust'
  | 'production_residue'
  | 'frequent_water'
  | 'other';

export type JointCondition = 'good' | 'deteriorated' | 'open' | 'damaged_edges' | 'unknown';

export type AreaUseType =
  | 'pedestrian'
  | 'pallet_jacks'
  | 'forklift'
  | 'vehicles'
  | 'heavy_machinery'
  | 'production'
  | 'warehouse'
  | 'dispatch'
  | 'wash_area'
  | 'cold_room'
  | 'laboratory'
  | 'exterior'
  | 'other';

export type ExposureType =
  | 'frequent_water'
  | 'pressure_wash'
  | 'chemicals'
  | 'oils_greases'
  | 'high_temp'
  | 'low_temp'
  | 'thermal_shock'
  | 'permanent_moisture'
  | 'exterior_uv'
  | 'impacts'
  | 'abrasion'
  | 'none';

export type PhotoCategory =
  | 'overview'
  | 'problem'
  | 'crack'
  | 'joint'
  | 'moisture'
  | 'detachment'
  | 'contamination'
  | 'detail'
  | 'reference'
  | 'other';

export type MoistureRecord = {
  observed?: MoisturePresence;
  notes?: string;
  measured?: YesNo;
  method?: string;
  result?: string;
  unit?: string;
};

export type JointsRecord = {
  hasCracks?: YesNo;
  hasJoints?: YesNo;
  jointCondition?: JointCondition;
};

export type PhotoEvidence = {
  id: string;
  uri: string;
  surveyId: string;
  sectorId?: string;
  category?: PhotoCategory;
  caption?: string;
  createdAt: string;
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
  moisture?: MoistureRecord;
  contaminations: ContaminationType[];
  noRelevantContamination?: boolean;
  otherContamination?: string;
  joints?: JointsRecord;
  uses: AreaUseType[];
  otherUse?: string;
  trafficLevel?: TrafficLevel;
  exposures: ExposureType[];
  observations?: string;
  recommendation?: string;
  photos: PhotoEvidence[];
  createdAt: string;
  updatedAt: string;
};

export type Survey = {
  id: string;
  code: string;
  projectId: string;
  userId: string;
  status: SurveyStatus;
  surfaceType?: SurfaceType;
  totalArea?: number;
  scope?: SurveyScope;
  substrateType?: SubstrateType;
  otherSubstrate?: string;
  existingCoating?: YesNoUnknown;
  existingCoatingType?: ExistingCoatingType;
  otherExistingCoating?: string;
  existingCoatingCondition?: CoatingCondition;
  overallCondition?: SurfaceCondition;
  moisture?: MoistureRecord;
  contaminations: ContaminationType[];
  noRelevantContamination?: boolean;
  otherContamination?: string;
  joints?: JointsRecord;
  uses: AreaUseType[];
  otherUse?: string;
  trafficLevel?: TrafficLevel;
  exposures: ExposureType[];
  plantOperational?: YesNo;
  scheduleRestrictions?: YesNo;
  accessNotes?: string;
  machineryToRemove?: YesNo;
  siteComments?: string;
  visitReason?: string;
  generalObservations?: string;
  conclusion?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  sectors: SurveySector[];
  photos: PhotoEvidence[];
};

export type ClientDraft = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'archivedAt'>;
export type ProjectDraft = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type SectorDraft = Omit<SurveySector, 'id' | 'surveyId' | 'createdAt' | 'updatedAt' | 'photos'> & {
  photos?: PhotoEvidence[];
};
