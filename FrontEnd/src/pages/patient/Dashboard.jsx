import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import "./dashboard.css"

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");

  const { toast } = useToast();
  const token = localStorage.getItem("token");

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch all data when user is loaded
  useEffect(() => {
    if (!user?.patient?.patientId) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/appointment/patient/${user.patient.patientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to load appointments");
        const data = await res.json();
        setAppointments(data || []);
      } catch (err) {
        console.error(err);
        setAppointments([]);
      }
    };

    const fetchPrescriptions = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/prescriptions/patient/${user.patient.patientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to load prescriptions");
        const data = await res.json();
        setPrescriptions(data || []);
      } catch (err) {
        console.error(err);
        setPrescriptions([]);
      }
    };

    const fetchDoctors = async () => {
      try {
        const res = await fetch("http://localhost:8080/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load doctors");
        const data = await res.json();
        setDoctors(data || []);
      } catch (err) {
        console.error(err);
        setDoctors([]);
      }
    };

    Promise.all([fetchAppointments(), fetchPrescriptions(), fetchDoctors()])
      .finally(() => setLoading(false));
  }, [user, token]);


    function formatTime(time) {
      if (!time) return "";

      const [hour, minute] = time.split(":").map(Number);

      let h = hour;
      let suffix = "AM";

      if (hour >= 12) {
        suffix = "PM";
        if (hour > 12) h = hour - 12;   // convert 13–23 → 1–11
      }

      return `${h}:${String(minute).padStart(2, "0")} ${suffix}`;
    }

  // Add Appointment
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !user?.patient?.patientId) return;

    try {
      const doctor = doctors.find(d => d.doctorId.toString() === selectedDoctor);
      if (!doctor) throw new Error("Doctor not found");

      const payload = {
        patientId: user.patient.patientId,
        patientName: user.patient.patientName || "",
        doctorId: doctor.doctorId,
        doctorName: doctor.doctorName || "",
        appointmentDate
      };

      const res = await fetch("http://localhost:8080/appointment/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Failed to add appointment";
        try {
          const data = await res.json();
          if (data && (data.message_en || data.message_ar)) {
            errorMsg = `${data.message_en || ""}${data.message_ar ? " | " + data.message_ar : ""}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorMsg = text;
        }
        toast({ title: "Failed to add appointment", description: errorMsg, variant: "destructive" });
        return;
      }

      const newAppointment = await res.json();
      toast({ title: "Appointment added successfully!" });
      setModalOpen(false);
      setSelectedDoctor("");
      setAppointmentDate("");
      setAppointments(prev => [...prev, newAppointment]);
    } catch (err) {
      toast({ title: "Failed to add appointment", description: err.message, variant: "destructive" });
    }
  };

  // Edit Status
  const handleEditStatus = async (e) => {
    e.preventDefault();
    if (!editStatusModalOpen || !user?.patient?.patientId) return;

    try {
      const payload = {
        patientId: user.patient.patientId,
        patientName: user.patient.patientName,
        patientPhone: user.patient.patientPhone,
        patientGender: user.patient.patientGender,
        patientAge: user.patient.patientAge,
        patientStatus: editStatus,
        userId: user.userId,
      };

      const res = await fetch(`http://localhost:8080/patient/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Failed to update status";
        try {
          const data = await res.json();
          if (data && (data.message_en || data.message_ar)) {
            errorMsg = `${data.message_en || ""}${data.message_ar ? " | " + data.messageAr : ""}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorMsg = text;
        }
        toast({ title: "Failed to update status", description: errorMsg, variant: "destructive" });
        return;
      }

      const updatedPatient = await res.json();
      setUser(prev => ({ ...prev, patient: updatedPatient }));

      toast({ title: "Status updated successfully!" });
      setEditStatusModalOpen(false);
      setEditStatus("");
    } catch (err) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  };

  // Helper to format date safely
const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";

  try {
    const d = new Date(dateStr);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    let suffix = "AM";

    if (hours >= 12) {
      suffix = "PM";
      if (hours > 12) hours = hours - 12; // Convert 13–23 → 1–11
    }

    if (hours === 0) hours = 12; // Midnight case

    return `${d.toLocaleDateString()} ${hours}:${minutes}:${seconds} ${suffix}`;
  } catch {
    return dateStr;
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between transition-base">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome, {user?.patient?.patientName || "Loading..."}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Your health dashboard and upcoming appointments.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Appointment
        </Button>
      </div>

      {/* Status and Edit Button */}
      <div className="mt-2">
        <span className="font-semibold">Status:</span> {user?.patient?.patientStatus || "—"}
        <Button size="sm" variant="outline" className="ml-2" onClick={() => setEditStatusModalOpen(true)}>
          Edit Status
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-base hover:shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p>Loading...</p> :
              appointments.length > 0 ? appointments.map((appointment) => {
                const doctorName = appointment.doctorName || appointment.doctor?.doctorName || "—";
                const date = formatDateTime(appointment.appointmentDate);
              
                return (
                  <div key={appointment.appointmentId} className="flex items-center justify-between p-3 rounded-lg border transition-base hover:bg-muted/30">
                    <div>
                      <p>Appointment Id: {appointment.appointmentId}</p>
                      <p className="font-medium">Dr: {doctorName}</p>
                      
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{date}</p>
                    </div>
                  </div>
                );
              }) : <p>No appointments found</p>
            }
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card className="transition-base hover:shadow-sm">
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p>Loading prescriptions...</p> :
              prescriptions.length > 0 ? prescriptions.map((prescription) => {
                const doctorName = prescription.doctorName || prescription.doctor?.doctorName || "—";
                const date = formatDateTime(prescription.dateIssued);
                const notes = prescription.notes || "";
                return (
                  <div key={prescription.prescriptionId} className="p-3 rounded-lg border transition-base hover:bg-muted/30 space-y-2">
                    <div className="flex flex-col justify-between">
                      <p>Appointment Id: {prescription.appointmentId}</p>
                      <p className="font-medium">Dr. {doctorName}</p>
                      <p className="text-sm font-medium">{date}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Notes: {notes}</p>
                  </div>
                );
              }) : <p>No prescriptions found</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* Add Appointment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black back bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-background modal p-6 rounded-lg max-w-md shadow-lg space-y-4">
            <h2 className="text-xl font-bold">Add Appointment</h2>
            <p className="bg-red-400 clinicDate">The Clinic is Open from 7:00 AM to 11:59 PM</p>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Appointment Date</Label>
                <Input
                  id="appointmentDate"
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Select Doctor</Label>
                <select
                  id="doctor"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.doctorId} value={doc.doctorId}>
                      {doc.doctorName || doc.username} - Available: {`${formatTime(doc.attendTime)} - ${formatTime(doc.leaveTime)} - available on ${doc.workingDays || "N/A"}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Add</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editStatusModalOpen && (
        <div className="fixed inset-0 back bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-background modal p-6 rounded-lg max-w-md shadow-lg space-y-4">
            <h2 className="text-xl font-bold">Edit Status</h2>
            <form onSubmit={handleEditStatus} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editStatus">Patient Status</Label>
                <textarea
                  id="editStatus"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditStatusModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
