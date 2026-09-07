export interface AssignedDistrict {
  id: number;
  name: string;
}

export interface AssignedTaluka {
  id: number;
  name: string;
  district_id?: number;
  district_name?: string;
}

export interface AssignedTalukaScope {
  id: number;
  name: string;
  district_id?: number;
  district_name?: string;
  label?: string;
  scope?: string;
}

export interface AssignedVillage {
  id: number;
  name: string;
  taluka_id: number;
  taluka_name?: string;
  district_id?: number;
  district_name?: string;
}

export interface AssignedLocationsPayload {
  has_assignment?: boolean;
  districts: AssignedDistrict[];
  talukas: AssignedTaluka[];
  villages: AssignedVillage[];
  work_full_city_taluka_ids?: number[];
  work_village_ids?: number[];
  taluka_scopes?: AssignedTalukaScope[];
}

export interface AssignedFarmSearchRecord {
  farmer_id: number;
  farmer_code?: string | null;
  farmer_name?: string | null;
  farmer_mobile?: string | null;
  farm_id: number;
  farm_code?: string | null;
  farm_name?: string | null;
  village?: string | null;
  taluka?: string | null;
  district?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
