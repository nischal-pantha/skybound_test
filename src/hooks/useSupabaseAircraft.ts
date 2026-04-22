import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface AircraftProfile {
  id: string;
  name: string;
  registration: string | null;
  empty_weight: number | null;
  max_weight: number | null;
  forward_cg_limit: number | null;
  aft_cg_limit: number | null;
  fuel_arm: number | null;
  front_seat_arm: number | null;
  rear_seat_arm: number | null;
  baggage_arm: number | null;
  max_fuel: number | null;
  fuel_burn_rate: number | null;
  cruise_speed: number | null;
  max_range: number | null;
  service_ceiling: number | null;
  performance_data: Json;
  created_at: string;
  updated_at: string;
}

export function useSupabaseAircraft() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aircraft, setAircraft] = useState<AircraftProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAircraft = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('aircraft_profiles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching aircraft:', error);
    } else {
      setAircraft((data || []) as AircraftProfile[]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchAircraft().finally(() => setLoading(false));
    } else {
      setAircraft([]);
      setLoading(false);
    }
  }, [user, fetchAircraft]);

  const addAircraft = async (profile: Omit<AircraftProfile, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('aircraft_profiles')
      .insert({
        name: profile.name,
        registration: profile.registration,
        empty_weight: profile.empty_weight,
        max_weight: profile.max_weight,
        forward_cg_limit: profile.forward_cg_limit,
        aft_cg_limit: profile.aft_cg_limit,
        fuel_arm: profile.fuel_arm,
        front_seat_arm: profile.front_seat_arm,
        rear_seat_arm: profile.rear_seat_arm,
        baggage_arm: profile.baggage_arm,
        max_fuel: profile.max_fuel,
        fuel_burn_rate: profile.fuel_burn_rate,
        cruise_speed: profile.cruise_speed,
        max_range: profile.max_range,
        service_ceiling: profile.service_ceiling,
        performance_data: profile.performance_data,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add aircraft',
        variant: 'destructive'
      });
      return null;
    }

    setAircraft(prev => [...prev, data as AircraftProfile].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Success', description: 'Aircraft added' });
    return data as AircraftProfile;
  };

  const updateAircraft = async (id: string, updates: Partial<AircraftProfile>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.registration !== undefined) updateData.registration = updates.registration;
    if (updates.empty_weight !== undefined) updateData.empty_weight = updates.empty_weight;
    if (updates.max_weight !== undefined) updateData.max_weight = updates.max_weight;
    if (updates.forward_cg_limit !== undefined) updateData.forward_cg_limit = updates.forward_cg_limit;
    if (updates.aft_cg_limit !== undefined) updateData.aft_cg_limit = updates.aft_cg_limit;
    if (updates.fuel_arm !== undefined) updateData.fuel_arm = updates.fuel_arm;
    if (updates.front_seat_arm !== undefined) updateData.front_seat_arm = updates.front_seat_arm;
    if (updates.rear_seat_arm !== undefined) updateData.rear_seat_arm = updates.rear_seat_arm;
    if (updates.baggage_arm !== undefined) updateData.baggage_arm = updates.baggage_arm;
    if (updates.max_fuel !== undefined) updateData.max_fuel = updates.max_fuel;
    if (updates.fuel_burn_rate !== undefined) updateData.fuel_burn_rate = updates.fuel_burn_rate;
    if (updates.cruise_speed !== undefined) updateData.cruise_speed = updates.cruise_speed;
    if (updates.max_range !== undefined) updateData.max_range = updates.max_range;
    if (updates.service_ceiling !== undefined) updateData.service_ceiling = updates.service_ceiling;
    if (updates.performance_data !== undefined) updateData.performance_data = updates.performance_data;

    const { error } = await supabase
      .from('aircraft_profiles')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update aircraft',
        variant: 'destructive'
      });
      return false;
    }

    setAircraft(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
    toast({ title: 'Success', description: 'Aircraft updated' });
    return true;
  };

  const deleteAircraft = async (id: string) => {
    const { error } = await supabase
      .from('aircraft_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete aircraft',
        variant: 'destructive'
      });
      return false;
    }

    setAircraft(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Deleted', description: 'Aircraft removed' });
    return true;
  };

  const getAircraft = (id: string) => aircraft.find(a => a.id === id);

  return {
    aircraft,
    loading,
    addAircraft,
    updateAircraft,
    deleteAircraft,
    getAircraft,
    refresh: fetchAircraft
  };
}
