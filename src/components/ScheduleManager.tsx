
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Plane } from "lucide-react";
import { FlightSchedulingForm } from "./FlightSchedulingForm";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";

export const ScheduleManager = () => {
  const { flightSchedules } = useSupabaseFlightData();
  const [showAddForm, setShowAddForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const upcomingFlights = flightSchedules.filter(flight => 
    flight.date >= today && flight.status === 'scheduled'
  );

  const handleCloseForm = () => {
    setShowAddForm(false);
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Schedule Flight</h2>
            <p className="text-gray-600">Book your training sessions and flights</p>
          </div>
          <Button variant="outline" onClick={() => setShowAddForm(false)}>
            Back to Schedule
          </Button>
        </div>
        <FlightSchedulingForm onClose={handleCloseForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Flight Schedule</h2>
          <p className="text-gray-600">Manage your flight training schedule</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Flight
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Flights ({upcomingFlights.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingFlights.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No upcoming flights scheduled</p>
              <Button onClick={() => setShowAddForm(true)}>
                Schedule Your First Flight
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingFlights
                .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                .map((flight) => (
                <div key={flight.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-medium">{new Date(flight.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">{flight.time}</div>
                      </div>
                      <div className="w-px h-12 bg-gray-200"></div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          {flight.aircraft}
                        </div>
                        <div className="text-sm text-gray-600">
                          {flight.instructor || 'Solo Flight'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Flight Type</div>
                      <div className="font-medium capitalize">{flight.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="font-medium">{flight.duration} hours</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-medium capitalize">{flight.status}</div>
                    </div>
                  </div>

                  {flight.notes && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500">Notes</div>
                      <div className="text-sm">{flight.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
