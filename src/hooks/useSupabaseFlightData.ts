import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface FlightLogEntry {
  id: string;
  date: string;
  aircraft: string;
  departure: string;
  destination: string;
  route: string | null;
  flight_time: number;
  landings: number;
  approaches: number;
  holds: number;
  cross_country: number;
  night: number;
  instrument: number;
  solo: boolean;
  dual: boolean;
  pic: boolean;
  instructor: string | null;
  remarks: string | null;
  waypoints: Json;
  created_at: string;
}

export interface FlightScheduleEntry {
  id: string;
  date: string;
  time: string;
  aircraft: string;
  instructor: string | null;
  type: string;
  duration: number;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface FlightPlanEntry {
  id: string;
  name: string;
  aircraft: string | null;
  departure: string | null;
  destination: string | null;
  alternate: string | null;
  altitude: number | null;
  airspeed: number | null;
  fuel: number | null;
  passengers: number | null;
  flight_rules: string;
  route_type: string;
  route_options: Json;
  waypoints: Json;
  remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSupabaseFlightData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flightLogs, setFlightLogs] = useState<FlightLogEntry[]>([]);
  const [flightSchedules, setFlightSchedules] = useState<FlightScheduleEntry[]>([]);
  const [flightPlans, setFlightPlans] = useState<FlightPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlightLogs = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('flight_logs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching flight logs:', error);
    } else {
      setFlightLogs((data || []) as FlightLogEntry[]);
    }
  }, [user]);

  const fetchFlightSchedules = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('flight_schedules')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      setFlightSchedules((data || []) as FlightScheduleEntry[]);
    }
  }, [user]);

  const fetchFlightPlans = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('flight_plans')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching flight plans:', error);
    } else {
      setFlightPlans((data || []) as FlightPlanEntry[]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchFlightLogs(), fetchFlightSchedules(), fetchFlightPlans()])
        .finally(() => setLoading(false));
    } else {
      setFlightLogs([]);
      setFlightSchedules([]);
      setFlightPlans([]);
      setLoading(false);
    }
  }, [user, fetchFlightLogs, fetchFlightSchedules, fetchFlightPlans]);

  // Flight Logs CRUD
  const addFlightLog = async (entry: Omit<FlightLogEntry, 'id' | 'created_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('flight_logs')
      .insert({
        aircraft: entry.aircraft,
        date: entry.date,
        departure: entry.departure,
        destination: entry.destination,
        route: entry.route,
        flight_time: entry.flight_time,
        landings: entry.landings,
        approaches: entry.approaches,
        holds: entry.holds,
        cross_country: entry.cross_country,
        night: entry.night,
        instrument: entry.instrument,
        solo: entry.solo,
        dual: entry.dual,
        pic: entry.pic,
        instructor: entry.instructor,
        remarks: entry.remarks,
        waypoints: entry.waypoints,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add flight log',
        variant: 'destructive'
      });
      return null;
    }

    setFlightLogs(prev => [data as FlightLogEntry, ...prev]);
    toast({ title: 'Success', description: 'Flight log added' });
    return data as FlightLogEntry;
  };

  const updateFlightLog = async (id: string, updates: Partial<FlightLogEntry>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.aircraft !== undefined) updateData.aircraft = updates.aircraft;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.departure !== undefined) updateData.departure = updates.departure;
    if (updates.destination !== undefined) updateData.destination = updates.destination;
    if (updates.route !== undefined) updateData.route = updates.route;
    if (updates.flight_time !== undefined) updateData.flight_time = updates.flight_time;
    if (updates.landings !== undefined) updateData.landings = updates.landings;
    if (updates.approaches !== undefined) updateData.approaches = updates.approaches;
    if (updates.holds !== undefined) updateData.holds = updates.holds;
    if (updates.cross_country !== undefined) updateData.cross_country = updates.cross_country;
    if (updates.night !== undefined) updateData.night = updates.night;
    if (updates.instrument !== undefined) updateData.instrument = updates.instrument;
    if (updates.solo !== undefined) updateData.solo = updates.solo;
    if (updates.dual !== undefined) updateData.dual = updates.dual;
    if (updates.pic !== undefined) updateData.pic = updates.pic;
    if (updates.instructor !== undefined) updateData.instructor = updates.instructor;
    if (updates.remarks !== undefined) updateData.remarks = updates.remarks;
    if (updates.waypoints !== undefined) updateData.waypoints = updates.waypoints;

    const { error } = await supabase
      .from('flight_logs')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update flight log',
        variant: 'destructive'
      });
      return false;
    }

    setFlightLogs(prev => prev.map(log => 
      log.id === id ? { ...log, ...updates } : log
    ));
    return true;
  };

  const deleteFlightLog = async (id: string) => {
    const { error } = await supabase
      .from('flight_logs')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete flight log',
        variant: 'destructive'
      });
      return false;
    }

    setFlightLogs(prev => prev.filter(log => log.id !== id));
    toast({ title: 'Deleted', description: 'Flight log removed' });
    return true;
  };

  // Flight Schedules CRUD
  const addFlightSchedule = async (schedule: Omit<FlightScheduleEntry, 'id' | 'created_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('flight_schedules')
      .insert({
        date: schedule.date,
        time: schedule.time,
        aircraft: schedule.aircraft,
        instructor: schedule.instructor,
        type: schedule.type,
        duration: schedule.duration,
        notes: schedule.notes,
        status: schedule.status,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add schedule',
        variant: 'destructive'
      });
      return null;
    }

    setFlightSchedules(prev => [...prev, data as FlightScheduleEntry].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    toast({ title: 'Success', description: 'Flight scheduled' });
    return data as FlightScheduleEntry;
  };

  const updateFlightSchedule = async (id: string, updates: Partial<FlightScheduleEntry>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.aircraft !== undefined) updateData.aircraft = updates.aircraft;
    if (updates.instructor !== undefined) updateData.instructor = updates.instructor;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('flight_schedules')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive'
      });
      return false;
    }

    setFlightSchedules(prev => prev.map(schedule => 
      schedule.id === id ? { ...schedule, ...updates } : schedule
    ));
    return true;
  };

  const deleteFlightSchedule = async (id: string) => {
    const { error } = await supabase
      .from('flight_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive'
      });
      return false;
    }

    setFlightSchedules(prev => prev.filter(s => s.id !== id));
    return true;
  };

  // Flight Plans CRUD
  const addFlightPlan = async (plan: Omit<FlightPlanEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('flight_plans')
      .insert({
        name: plan.name,
        aircraft: plan.aircraft,
        departure: plan.departure,
        destination: plan.destination,
        alternate: plan.alternate,
        altitude: plan.altitude,
        airspeed: plan.airspeed,
        fuel: plan.fuel,
        passengers: plan.passengers,
        flight_rules: plan.flight_rules,
        route_type: plan.route_type,
        route_options: plan.route_options,
        waypoints: plan.waypoints,
        remarks: plan.remarks,
        status: plan.status,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save flight plan',
        variant: 'destructive'
      });
      return null;
    }

    setFlightPlans(prev => [data as FlightPlanEntry, ...prev]);
    toast({ title: 'Success', description: 'Flight plan saved' });
    return data as FlightPlanEntry;
  };

  const updateFlightPlan = async (id: string, updates: Partial<FlightPlanEntry>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.aircraft !== undefined) updateData.aircraft = updates.aircraft;
    if (updates.departure !== undefined) updateData.departure = updates.departure;
    if (updates.destination !== undefined) updateData.destination = updates.destination;
    if (updates.alternate !== undefined) updateData.alternate = updates.alternate;
    if (updates.altitude !== undefined) updateData.altitude = updates.altitude;
    if (updates.airspeed !== undefined) updateData.airspeed = updates.airspeed;
    if (updates.fuel !== undefined) updateData.fuel = updates.fuel;
    if (updates.passengers !== undefined) updateData.passengers = updates.passengers;
    if (updates.flight_rules !== undefined) updateData.flight_rules = updates.flight_rules;
    if (updates.route_type !== undefined) updateData.route_type = updates.route_type;
    if (updates.route_options !== undefined) updateData.route_options = updates.route_options;
    if (updates.waypoints !== undefined) updateData.waypoints = updates.waypoints;
    if (updates.remarks !== undefined) updateData.remarks = updates.remarks;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('flight_plans')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update flight plan',
        variant: 'destructive'
      });
      return false;
    }

    setFlightPlans(prev => prev.map(plan => 
      plan.id === id ? { ...plan, ...updates } : plan
    ));
    return true;
  };

  const deleteFlightPlan = async (id: string) => {
    const { error } = await supabase
      .from('flight_plans')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete flight plan',
        variant: 'destructive'
      });
      return false;
    }

    setFlightPlans(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Deleted', description: 'Flight plan removed' });
    return true;
  };

  // Statistics
  const getTotalFlightTime = () => flightLogs.reduce((sum, log) => sum + log.flight_time, 0);
  const getCrossCountryTime = () => flightLogs.reduce((sum, log) => sum + log.cross_country, 0);
  const getSoloTime = () => flightLogs.filter(log => log.solo).reduce((sum, log) => sum + log.flight_time, 0);
  const getNightTime = () => flightLogs.reduce((sum, log) => sum + log.night, 0);
  const getInstrumentTime = () => flightLogs.reduce((sum, log) => sum + log.instrument, 0);
  const getTotalLandings = () => flightLogs.reduce((sum, log) => sum + log.landings, 0);

  // camelCase aliases for backward compatibility
  const flightEntries = flightLogs.map(log => ({
    ...log,
    flightTime: log.flight_time,
    crossCountry: log.cross_country,
  }));

  return {
    flightLogs,
    flightEntries,
    flightSchedules,
    flightPlans,
    loading,
    addFlightLog,
    updateFlightLog,
    deleteFlightLog,
    addFlightSchedule,
    updateFlightSchedule,
    deleteFlightSchedule,
    addFlightPlan,
    updateFlightPlan,
    deleteFlightPlan,
    getTotalFlightTime,
    getCrossCountryTime,
    getSoloTime,
    getNightTime,
    getInstrumentTime,
    getTotalLandings,
    refresh: () => Promise.all([fetchFlightLogs(), fetchFlightSchedules(), fetchFlightPlans()])
  };
}
