
import { AIRCRAFT_DATABASE } from './aircraftDatabase';

export interface ChecklistItem {
  text: string;
  critical?: boolean;
  note?: string;
}

export interface ChecklistSection {
  name: string;
  items: ChecklistItem[];
}

export interface AircraftChecklist {
  title: string;
  icon: string;
  description: string;
  sections: ChecklistSection[];
}

export interface AircraftChecklistsData {
  preflight: AircraftChecklist;
  runup: AircraftChecklist;
  takeoff: AircraftChecklist;
  approach: AircraftChecklist;
  emergency: AircraftChecklist;
}

// Cessna 152 specific checklists
const C152_CHECKLISTS: AircraftChecklistsData = {
  preflight: {
    title: "Pre-Flight Inspection",
    icon: "Settings",
    description: "Complete exterior and interior inspection per C152 POH Section 4",
    sections: [
      {
        name: "Cabin Interior",
        items: [
          { text: "Required documents (AROW) - PRESENT AND CURRENT", critical: true },
          { text: "Weight and balance - CALCULATED AND WITHIN LIMITS", critical: true },
          { text: "Control lock - REMOVE" },
          { text: "Ignition switch - OFF" },
          { text: "Master switch - OFF" },
          { text: "Fuel selector valve - BOTH" },
          { text: "Mixture - FULL RICH" },
          { text: "Throttle - CLOSED" },
          { text: "Flight controls - FREE AND CORRECT MOVEMENT", critical: true }
        ]
      },
      {
        name: "Engine Compartment",
        items: [
          { text: "Cowling - SECURE, NO DAMAGE" },
          { text: "Engine oil level - CHECK (minimum 4 qts)", critical: true, note: "Add if below 5 qts" },
          { text: "Engine oil cap - SECURE" },
          { text: "Fuel strainer - DRAIN", note: "Check for water/contamination" },
          { text: "Propeller and spinner - CHECK FOR DAMAGE/SECURITY" },
          { text: "Air filter - CLEAN AND SECURE" },
          { text: "Exhaust system - CHECK FOR CRACKS/SECURITY" },
          { text: "Engine compartment - CHECK FOR LEAKS/DAMAGE" }
        ]
      },
      {
        name: "Left Wing",
        items: [
          { text: "Wing tip - CHECK FOR DAMAGE" },
          { text: "Navigation light - CHECK CONDITION" },
          { text: "Pitot tube - CHECK/UNCOVERED", critical: true },
          { text: "Fuel tank quantity - VISUALLY CHECK", critical: true },
          { text: "Fuel tank cap - SECURE AND LOCKED" },
          { text: "Wing flaps - CHECK OPERATION AND SECURITY" },
          { text: "Main landing gear - CHECK STRUTS/TIRES" },
          { text: "Wing root area - CHECK FOR DAMAGE" }
        ]
      },
      {
        name: "Empennage",
        items: [
          { text: "Rudder - CHECK FREEDOM OF MOVEMENT" },
          { text: "Elevator - CHECK FREEDOM OF MOVEMENT" },
          { text: "Elevator trim tab - CHECK SECURITY" },
          { text: "Tail surfaces - CHECK FOR DAMAGE" },
          { text: "Static port - CHECK/UNOBSTRUCTED", critical: true },
          { text: "Tie-down chains/ropes - REMOVE" }
        ]
      },
      {
        name: "Right Wing",
        items: [
          { text: "Wing flaps - CHECK OPERATION AND SECURITY" },
          { text: "Main landing gear - CHECK STRUTS/TIRES" },
          { text: "Fuel tank quantity - VISUALLY CHECK", critical: true },
          { text: "Fuel tank cap - SECURE AND LOCKED" },
          { text: "Wing tip - CHECK FOR DAMAGE" },
          { text: "Navigation light - CHECK CONDITION" },
          { text: "Stall warning vane - CHECK OPERATION" }
        ]
      },
      {
        name: "Nose Section",
        items: [
          { text: "Propeller - CHECK FOR NICKS/DAMAGE" },
          { text: "Spinner - SECURE" },
          { text: "Nose gear - CHECK STRUT/TIRE" },
          { text: "Cowling - SECURE LATCHES" },
          { text: "Windscreen - CLEAN" }
        ]
      }
    ]
  },
  runup: {
    title: "Engine Run-Up",
    icon: "Zap",
    description: "Engine start and run-up procedures per C152 POH",
    sections: [
      {
        name: "Before Engine Start",
        items: [
          { text: "Preflight inspection - COMPLETE", critical: true },
          { text: "Passenger briefing - COMPLETE (if applicable)" },
          { text: "Seat belts - SECURE", critical: true },
          { text: "Fuel selector valve - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Throttle - CLOSED" },
          { text: "Master switch - ON" },
          { text: "Beacon - ON" }
        ]
      },
      {
        name: "Engine Start",
        items: [
          { text: "Area around propeller - CLEAR", critical: true },
          { text: "Prime engine - AS REQUIRED", note: "2-6 strokes when cold" },
          { text: "Throttle - CRACKED OPEN (1/4 inch)" },
          { text: "Ignition switch - START", note: "Release when engine starts" },
          { text: "Oil pressure - CHECK", critical: true, note: "Within 30 seconds" },
          { text: "Engine RPM - 800-1000 RPM" }
        ]
      },
      {
        name: "Run-Up (1700 RPM)",
        items: [
          { text: "Run-up area - TAXI TO" },
          { text: "Brakes - SET" },
          { text: "Flight controls - CHECK" },
          { text: "Engine - 1700 RPM" },
          { text: "Magnetos - CHECK L, R, BOTH", critical: true, note: "Max drop 175 RPM, max diff 50 RPM" },
          { text: "Carburetor heat - CHECK", note: "RPM drop expected" },
          { text: "Engine - REDUCE TO IDLE" },
          { text: "Oil temperature and pressure - CHECK" }
        ]
      }
    ]
  },
  takeoff: {
    title: "Before Takeoff",
    icon: "Plane",
    description: "Final checks before takeoff per C152 POH",
    sections: [
      {
        name: "Pre-Takeoff Final",
        items: [
          { text: "Flight controls - FREE AND CORRECT", critical: true },
          { text: "Flight instruments - SET" },
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Carburetor heat - COLD" },
          { text: "Elevator trim - SET FOR TAKEOFF" },
          { text: "Door and windows - CLOSED AND LOCKED", critical: true }
        ]
      },
      {
        name: "Engine and Systems",
        items: [
          { text: "Engine instruments - CHECK" },
          { text: "Oil temperature and pressure - CHECK" },
          { text: "Magnetos - BOTH" },
          { text: "Transponder - ALT" },
          { text: "Radios - SET" }
        ]
      }
    ]
  },
  approach: {
    title: "Approach & Landing",
    icon: "ClipboardCheck",
    description: "Approach and landing procedures per C152 POH",
    sections: [
      {
        name: "Before Landing",
        items: [
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Seatbelts - SECURE", critical: true },
          { text: "Approach speed - 65 KIAS", critical: true }
        ]
      },
      {
        name: "Final Approach",
        items: [
          { text: "Carburetor heat - ON (as required)" },
          { text: "Flaps - AS REQUIRED" },
          { text: "Airspeed - 60 KIAS (flaps up), 55 KIAS (flaps down)", critical: true },
          { text: "Touchdown - MAIN WHEELS FIRST" }
        ]
      },
      {
        name: "After Landing",
        items: [
          { text: "Flaps - UP" },
          { text: "Carburetor heat - COLD" },
          { text: "Transponder - STANDBY" }
        ]
      }
    ]
  },
  emergency: {
    title: "Emergency Procedures",
    icon: "AlertTriangle",
    description: "Critical emergency procedures per C152 POH",
    sections: [
      {
        name: "Engine Failure in Flight",
        items: [
          { text: "Airspeed - 60 KIAS (best glide)", critical: true },
          { text: "Landing site - SELECT" },
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Carburetor heat - ON" },
          { text: "Ignition - BOTH" },
          { text: "Master switch - ON" }
        ]
      },
      {
        name: "Emergency Landing",
        items: [
          { text: "Fuel selector - OFF", critical: true },
          { text: "Mixture - IDLE CUT-OFF", critical: true },
          { text: "Ignition switch - OFF", critical: true },
          { text: "Master switch - OFF", critical: true },
          { text: "Doors - UNLATCH PRIOR TO TOUCHDOWN", critical: true }
        ]
      }
    ]
  }
};

// Cessna 172 specific checklists
const C172_CHECKLISTS: AircraftChecklistsData = {
  preflight: {
    title: "Pre-Flight Inspection",
    icon: "Settings",
    description: "Complete exterior and interior inspection per C172 POH Section 4",
    sections: [
      {
        name: "Cabin Interior",
        items: [
          { text: "Required documents (AROW) - PRESENT AND CURRENT", critical: true },
          { text: "Weight and balance - CALCULATED AND WITHIN LIMITS", critical: true },
          { text: "Control lock - REMOVE" },
          { text: "Ignition switch - OFF" },
          { text: "Master switch - OFF" },
          { text: "Fuel selector valve - BOTH" },
          { text: "Mixture - FULL RICH" },
          { text: "Propeller - HIGH RPM" },
          { text: "Flight controls - FREE AND CORRECT MOVEMENT", critical: true }
        ]
      },
      {
        name: "Engine Compartment",
        items: [
          { text: "Cowling - SECURE, NO DAMAGE" },
          { text: "Engine oil level - CHECK (minimum 6 qts)", critical: true, note: "Add if below 7 qts" },
          { text: "Engine oil cap - SECURE" },
          { text: "Fuel strainer - DRAIN", note: "Check for water/contamination" },
          { text: "Propeller and spinner - CHECK FOR DAMAGE/SECURITY" },
          { text: "Air filter - CLEAN AND SECURE" },
          { text: "Exhaust system - CHECK FOR CRACKS/SECURITY" },
          { text: "Engine compartment - CHECK FOR LEAKS/DAMAGE" },
          { text: "Battery - CHECK CONNECTIONS" }
        ]
      },
      {
        name: "Left Wing",
        items: [
          { text: "Wing tip - CHECK FOR DAMAGE" },
          { text: "Navigation light - CHECK CONDITION" },
          { text: "Pitot tube - CHECK/UNCOVERED", critical: true },
          { text: "Fuel tank quantity - VISUALLY CHECK", critical: true },
          { text: "Fuel tank cap - SECURE AND LOCKED" },
          { text: "Wing flaps - CHECK OPERATION AND SECURITY" },
          { text: "Main landing gear - CHECK STRUTS/TIRES/BRAKES" },
          { text: "Gear doors/fairings - SECURE" }
        ]
      },
      {
        name: "Empennage",
        items: [
          { text: "Rudder - CHECK FREEDOM OF MOVEMENT" },
          { text: "Elevator - CHECK FREEDOM OF MOVEMENT" },
          { text: "Elevator trim tab - CHECK SECURITY" },
          { text: "Tail surfaces - CHECK FOR DAMAGE" },
          { text: "Static port(s) - CHECK/UNOBSTRUCTED", critical: true },
          { text: "Tie-down chains/ropes - REMOVE" }
        ]
      },
      {
        name: "Right Wing",
        items: [
          { text: "Wing flaps - CHECK OPERATION AND SECURITY" },
          { text: "Main landing gear - CHECK STRUTS/TIRES/BRAKES" },
          { text: "Fuel tank quantity - VISUALLY CHECK", critical: true },
          { text: "Fuel tank cap - SECURE AND LOCKED" },
          { text: "Wing tip - CHECK FOR DAMAGE" },
          { text: "Navigation light - CHECK CONDITION" },
          { text: "Stall warning vane - CHECK OPERATION" }
        ]
      },
      {
        name: "Nose Section",
        items: [
          { text: "Propeller - CHECK FOR NICKS/DAMAGE" },
          { text: "Spinner - SECURE" },
          { text: "Landing light - CHECK CONDITION" },
          { text: "Nose gear - CHECK STRUT/TIRE/STEERING" },
          { text: "Cowling - SECURE LATCHES" },
          { text: "Windscreen - CLEAN" }
        ]
      }
    ]
  },
  runup: {
    title: "Engine Run-Up",
    icon: "Zap",
    description: "Engine start and run-up procedures per C172 POH",
    sections: [
      {
        name: "Before Engine Start",
        items: [
          { text: "Preflight inspection - COMPLETE", critical: true },
          { text: "Passenger briefing - COMPLETE (if applicable)" },
          { text: "Seat belts and shoulder harnesses - SECURE", critical: true },
          { text: "Fuel selector valve - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Propeller - HIGH RPM" },
          { text: "Master switch - ON" },
          { text: "Beacon - ON" }
        ]
      },
      {
        name: "Engine Start",
        items: [
          { text: "Area around propeller - CLEAR", critical: true },
          { text: "Electric fuel pump - ON (if equipped)" },
          { text: "Prime engine - AS REQUIRED", note: "2-6 strokes when cold" },
          { text: "Throttle - CRACKED OPEN (1/4 inch)" },
          { text: "Ignition switch - START", note: "Release when engine starts" },
          { text: "Oil pressure - CHECK", critical: true, note: "Within 30 seconds" },
          { text: "Engine RPM - 1000 RPM" },
          { text: "Electric fuel pump - OFF (if equipped)" }
        ]
      },
      {
        name: "Run-Up (1700 RPM)",
        items: [
          { text: "Run-up area - TAXI TO" },
          { text: "Brakes - SET" },
          { text: "Flight controls - CHECK" },
          { text: "Engine - 1700 RPM" },
          { text: "Magnetos - CHECK L, R, BOTH", critical: true, note: "Max drop 175 RPM, max diff 50 RPM" },
          { text: "Carburetor heat - CHECK", note: "RPM drop expected" },
          { text: "Propeller governor - CHECK (if equipped)" },
          { text: "Engine - REDUCE TO IDLE" },
          { text: "Oil temperature and pressure - CHECK" }
        ]
      }
    ]
  },
  takeoff: {
    title: "Before Takeoff",
    icon: "Plane",
    description: "Final checks before takeoff per C172 POH",
    sections: [
      {
        name: "Pre-Takeoff Final",
        items: [
          { text: "Cabin doors and windows - CLOSED AND LOCKED", critical: true },
          { text: "Flight controls - FREE AND CORRECT", critical: true },
          { text: "Flight instruments - SET" },
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Propeller - HIGH RPM" },
          { text: "Elevator trim - SET FOR TAKEOFF" }
        ]
      },
      {
        name: "Engine and Systems",
        items: [
          { text: "Engine instruments - CHECK" },
          { text: "Oil temperature and pressure - CHECK" },
          { text: "Magnetos - BOTH" },
          { text: "Landing light - ON" },
          { text: "Strobes - ON" },
          { text: "Transponder - ALT" },
          { text: "Radios - SET" }
        ]
      }
    ]
  },
  approach: {
    title: "Approach & Landing",
    icon: "ClipboardCheck",
    description: "Approach and landing procedures per C172 POH",
    sections: [
      {
        name: "Before Landing",
        items: [
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Propeller - HIGH RPM" },
          { text: "Seatbelts - SECURE", critical: true },
          { text: "Landing light - ON" }
        ]
      },
      {
        name: "Final Approach",
        items: [
          { text: "Flaps - AS REQUIRED" },
          { text: "Airspeed - 65 KIAS (no flaps), 60 KIAS (full flaps)", critical: true },
          { text: "Trim - ADJUST" },
          { text: "Touchdown - MAIN WHEELS FIRST" }
        ]
      },
      {
        name: "After Landing",
        items: [
          { text: "Flaps - UP" },
          { text: "Transponder - STANDBY" }
        ]
      }
    ]
  },
  emergency: {
    title: "Emergency Procedures",
    icon: "AlertTriangle",
    description: "Critical emergency procedures per C172 POH",
    sections: [
      {
        name: "Engine Failure in Flight",
        items: [
          { text: "Airspeed - 68 KIAS (best glide)", critical: true },
          { text: "Landing site - SELECT" },
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Ignition - BOTH" },
          { text: "Electric fuel pump - ON (if equipped)" }
        ]
      },
      {
        name: "Emergency Landing",
        items: [
          { text: "Fuel selector - OFF", critical: true },
          { text: "Mixture - IDLE CUT-OFF", critical: true },
          { text: "Ignition switch - OFF", critical: true },
          { text: "Master switch - OFF", critical: true },
          { text: "Doors - UNLATCH PRIOR TO TOUCHDOWN", critical: true }
        ]
      }
    ]
  }
};

// Default generic checklists (existing ones from the original component)
const GENERIC_CHECKLISTS: AircraftChecklistsData = {
  preflight: {
    title: "Pre-Flight Inspection",
    icon: "Settings",
    description: "Complete exterior and interior inspection per POH Section 4",
    sections: [
      {
        name: "Cabin Interior",
        items: [
          { text: "Required documents (AROW) - PRESENT AND CURRENT", critical: true },
          { text: "Weight and balance - CALCULATED AND WITHIN LIMITS", critical: true },
          { text: "Control lock - REMOVE" },
          { text: "Ignition switch - OFF" },
          { text: "Master switch - OFF" },
          { text: "Fuel selector valve - BOTH (or ON for low-wing)" },
          { text: "Mixture - FULL RICH" },
          { text: "Propeller - HIGH RPM" },
          { text: "Cowl flaps - OPEN (if equipped)" },
          { text: "Flight controls - FREE AND CORRECT MOVEMENT", critical: true }
        ]
      },
      {
        name: "Engine Compartment",
        items: [
          { text: "Cowling - SECURE, NO DAMAGE" },
          { text: "Engine oil level - CHECK (minimum per POH)", critical: true },
          { text: "Engine oil cap - SECURE" },
          { text: "Fuel strainer - DRAIN", note: "Check for water/contamination" },
          { text: "Propeller and spinner - CHECK FOR DAMAGE/SECURITY" },
          { text: "Air filter - CLEAN AND SECURE" },
          { text: "Exhaust system - CHECK FOR CRACKS/SECURITY" },
          { text: "Engine compartment - CHECK FOR LEAKS/DAMAGE" },
          { text: "Battery - CHECK CONNECTIONS AND FLUID LEVEL" }
        ]
      }
    ]
  },
  runup: {
    title: "Engine Run-Up",
    icon: "Zap",
    description: "Engine start and run-up procedures per POH Section 4",
    sections: [
      {
        name: "Before Engine Start",
        items: [
          { text: "Preflight inspection - COMPLETE", critical: true },
          { text: "Passenger briefing - COMPLETE (if applicable)" },
          { text: "Seat belts - SECURE", critical: true },
          { text: "Fuel selector valve - BOTH (or ON)" },
          { text: "Mixture - RICH" },
          { text: "Master switch - ON" },
          { text: "Beacon - ON" }
        ]
      }
    ]
  },
  takeoff: {
    title: "Before Takeoff",
    icon: "Plane",
    description: "Final checks before takeoff per POH Section 4",
    sections: [
      {
        name: "Pre-Takeoff Final",
        items: [
          { text: "Flight controls - FREE AND CORRECT", critical: true },
          { text: "Flight instruments - SET" },
          { text: "Fuel selector - BOTH (or fullest tank)" },
          { text: "Mixture - RICH" },
          { text: "Door and windows - CLOSED AND LOCKED", critical: true }
        ]
      }
    ]
  },
  approach: {
    title: "Approach & Landing",
    icon: "ClipboardCheck",
    description: "Approach and landing procedures per POH Section 4",
    sections: [
      {
        name: "Before Landing",
        items: [
          { text: "Fuel selector - BOTH (or fullest tank)" },
          { text: "Mixture - RICH" },
          { text: "Seatbelts - SECURE", critical: true }
        ]
      }
    ]
  },
  emergency: {
    title: "Emergency Procedures",
    icon: "AlertTriangle",
    description: "Critical emergency procedures per POH Section 3",
    sections: [
      {
        name: "Engine Failure in Flight",
        items: [
          { text: "Airspeed - BEST GLIDE", critical: true },
          { text: "Landing site - SELECT AND PLAN APPROACH" },
          { text: "Fuel selector - BOTH" },
          { text: "Mixture - RICH" },
          { text: "Ignition switch - BOTH" }
        ]
      }
    ]
  }
};

export const AIRCRAFT_CHECKLISTS: Record<string, AircraftChecklistsData> = {
  'c152': C152_CHECKLISTS,
  'c172': C172_CHECKLISTS,
  'pa28': GENERIC_CHECKLISTS, // Use generic for now, can be customized later
  'c182': GENERIC_CHECKLISTS, // Use generic for now, can be customized later
  'generic': GENERIC_CHECKLISTS
};

export const getChecklistsForAircraft = (aircraftId: string): AircraftChecklistsData => {
  return AIRCRAFT_CHECKLISTS[aircraftId] || AIRCRAFT_CHECKLISTS['generic'];
};

export const getAvailableAircraftForChecklists = () => {
  return Object.keys(AIRCRAFT_DATABASE).map(id => ({
    id,
    name: AIRCRAFT_DATABASE[id].name,
    manufacturer: AIRCRAFT_DATABASE[id].manufacturer,
    model: AIRCRAFT_DATABASE[id].model
  }));
};
