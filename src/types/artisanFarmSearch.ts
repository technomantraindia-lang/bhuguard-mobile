export interface ArtisanAllocatedTaluka {
  id: number;
  name: string;
}

export interface ArtisanAllocatedVillage {
  id: number;
  name: string;
  taluka_id: number;
  taluka_name?: string;
  district_id?: number;
  district_name?: string;
}

export interface ArtisanFarmSearchRecord {
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
  area_acre?: number | null;
  area_hectare?: number | null;
  ownership_type?: string | null;
  mapping_status?: 'completed' | 'pending' | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  navigation_source?: 'boundary_centroid' | 'farm_gps' | 'mapped_location' | null;
  biochar_status?: string | null;
  last_biochar_date?: string | null;
  next_due_date?: string | null;
}

export interface ArtisanFarmSelectionParams {
  farmId: number;
  farmCode?: string;
  farmLabel?: string;
  farmerId?: number;
  farmerCode?: string;
  farmerName?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  mappingStatus?: string;
  navigationSource?: string | null;
}
