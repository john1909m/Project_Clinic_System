import { useEffect, useState } from "react";
import { Calendar, Users, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import "../patient/dashboard.css";

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);

  // Add Prescription form
  const [selectedPatient, setSelectedPatient] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Edit Prescription form
  const [editPrescription, setEditPrescription] = useState(null);
  const [editPatientId, setEditPatientId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Edit Patient form
  const [editPatient, setEditPatient] = useState(null);
  const [editPatientStatus, setEditPatientStatus] = useState("");

  // Add state for appointmentId in edit modal
  const [editAppointmentId, setEditAppointmentId] = useState("");

  // Add Prescription form state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");

  const { toast } = useToast();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const doctorId = user.doctor?.doctorId;

    const fetchData = async () => {
      try {
        const [appsRes, patientsRes, presRes] = await Promise.all([
          fetch(`http://localhost:8080/appointments/doctor/${doctorId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:8080/${doctorId}/patients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:8080/prescriptions/doctor/${doctorId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!appsRes.ok || !patientsRes.ok || !presRes.ok)
          throw new Error("Failed to fetch data");

        const [appsData, patientsData, presData] = await Promise.all([
          appsRes.json(),
          patientsRes.json(),
          presRes.json(),
        ]);

        setAppointments(appsData);
        setPatients(patientsData);
        setPrescriptions(presData);
      } catch (err) {
        toast({ title: "Error fetching data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const fetchPrescriptions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:8080/prescriptions/doctor/${user.doctor.doctorId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch prescriptions");
      setPrescriptions(await res.json());
    } catch (err) {
      toast({ title: "Error fetching prescriptions", variant: "destructive" });
    }
  };

  // Add Prescription
  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !date || !selectedAppointmentId) return;

    const patient = patients.find((p) => p.patientId.toString() === selectedPatient);
    if (!patient) return;

    const payload = {
      doctorId: user.doctor.doctorId,
      doctorName: user.doctor.doctorName,
      patientId: patient.patientId,
      patientName: patient.patientName,
      notes,
      dateIssued: `${date}T00:00:00`,
      appointmentId: selectedAppointmentId,
    };

    try {
      const res = await fetch("http://localhost:8080/prescription/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errorMsg = "Failed to add prescription";
        try {
          const data = await res.json();
          if (data && (data.message_en || data.message_ar)) {
            errorMsg = `${data.message_en || ""} ${data.message_ar ? " | " + data.message_ar : ""}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorMsg = text;
        }
        toast({ title: "Error adding prescription", description: errorMsg, variant: "destructive" });
        return;
      }

      toast({ title: "Prescription Added Successfully!" });
      setModalOpen(false);
      setSelectedPatient("");
      setNotes("");
      setDate("");
      setSelectedAppointmentId("");
      fetchPrescriptions();
    } catch (err) {
      toast({ title: "Error adding prescription", description: err.message, variant: "destructive" });
    }
  };

  // Open Edit Prescription
  const openEditPrescription = (presc) => {
    console.log("Editing prescription:", presc);
    setEditPrescription(presc);
    setEditPatientId(presc.patientId);
    setEditDate(presc.dateIssued?.slice(0, 10) || "");
    setEditNotes(presc.notes || "");
    setEditAppointmentId(presc.appointmentId ? presc.appointmentId.toString() : "");
    setEditModalOpen(true);
  };

  // Edit Prescription
  const handleEditPrescription = async (e) => {
    e.preventDefault();
    if (!editPrescription || !editPatientId || !editDate || !editAppointmentId) return;

    const payload = {
      prescriptionId: editPrescription.prescriptionId,
      patientId: editPatientId,
      doctorId: user.doctor.doctorId,
      dateIssued: `${editDate}T00:00:00`,
      notes: editNotes,
      appointmentId: editAppointmentId,
    };

    try {
      const res = await fetch("http://localhost:8080/prescription/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errorMsg = "Failed to update prescription";
        try {
          const data = await res.json();
          if (data && (data.message_en || data.message_ar)) {
            errorMsg = `${data.message_en || ""}${data.message_ar ? " | " + data.messageAr : ""}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorMsg = text;
        }
        toast({ title: "Error updating prescription", description: errorMsg, variant: "destructive" });
        return;
      }

      toast({ title: "Prescription updated!" });
      setEditModalOpen(false);
      fetchPrescriptions();
    } catch (err) {
      toast({ title: "Error updating prescription", description: err.message, variant: "destructive" });
    }
  };

  // Delete Prescription
  const handleDeletePrescription = async (id) => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;
    try {
      const res = await fetch(`http://localhost:8080/prescription/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete prescription");
      toast({ title: "Prescription deleted!" });
      fetchPrescriptions();
    } catch (err) {
      toast({ title: "Error deleting prescription", variant: "destructive" });
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    if (!editPatient) return;

    const payload = {
      ...editPatient,

      patientStatus: editPatientStatus,
    };

    try {
      const res = await fetch(`http://localhost:8080/patient/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update patient");
      toast({ title: "Patient status updated!" });
      setEditPatientModalOpen(false);
      // Optionally refresh patients list
      const doctorId = user.doctor?.doctorId;
      const patientsRes = await fetch(`http://localhost:8080/${doctorId}/patients`, { headers: { Authorization: `Bearer ${token}` } });
      if (patientsRes.ok) setPatients(await patientsRes.json());
    } catch (err) {
      toast({ title: "Error updating patient", variant: "destructive" });
    }
  };

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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome, Dr. {user?.doctor?.doctorName}</h1>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Prescription
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Appointments" value={appointments.length} icon={Calendar} description="Total doctor appointments" variant="primary" />
        <DashboardCard title="Patients" value={patients.length} icon={Users} description="Assigned to you" variant="success" />
        <DashboardCard title="Prescriptions" value={prescriptions.length} icon={FileText} description="Total prescriptions" variant="secondary" />
      </div>

      {/* Appointments */}
      <Card>
        <CardHeader><CardTitle>Doctor Appointments</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {appointments.length > 0 ? appointments.map((app) => (
            <div key={app.appointmentId} className="flex flex-col gap-1 p-3 rounded-lg border hover:bg-muted/30">
              <p>Id: {app.appointmentId}</p>
              <p className="font-medium">Patient name: {app.patientName}</p>
              
              <p className="text-sm">Date: {formatDateTime(app.appointmentDate)}</p>
            </div>
            
          )) : <p>No appointments</p>}
        </CardContent>
      </Card>

      {/* Patients */}
      <Card>
        <CardHeader><CardTitle>Your Patients</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {patients.length > 0 ? patients.map((p) => (
      <div key={p.patientId} className="p-3  rounded-lg border hover:bg-muted/30 flex justify-between items-center">
        <div className=" flex flex-col gap-2">
          <p className="font-medium"><strong>Patient name:</strong> {p.patientName}</p>
          <p className="text-sm text-muted-foreground"><strong>Patient phone:</strong> {p.patientPhone}</p>
          <p className="text-sm"><strong>Status:</strong> {p.patientStatus || "—"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => {
            setEditPatient(p);          // نحفظ المريض المختار
            setEditPatientStatus(p.patientStatus || ""); // نملأ الفورم باللي موجود
            setEditPatientModalOpen(true); // نفتح المودال
          }}>
          Edit Status
        </Button>
      </div>
    )) : <p>No patients found</p>}

    {/* Modal must be inside the return */}
    {editPatientModalOpen && (
      <div className="fixed inset-0 back flex items-center justify-center z-50">
        <div className="bg-white modal p-6 rounded-lg max-w-md space-y-4 shadow-lg">
          <h2 className="text-xl font-bold mb-2">Edit Patient Status</h2>
          <form onSubmit={handleEditPatient} className="space-y-4">
            <div>
              <label>Patient Name</label>
              <input type="text" value={editPatient?.patientName || ""} disabled className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label>Status</label>
              <textarea
                value={editPatientStatus}
                onChange={(e) => setEditPatientStatus(e.target.value)}
                className="w-full border rounded px-2 py-1"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditPatientModalOpen(false)}>Cancel</button>
              <Button type="submit">Update Status</Button>
            </div>
          </form>
        </div>
      </div>
    )}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card>
        <CardHeader><CardTitle>Your Prescriptions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {prescriptions.length > 0 ? prescriptions.map((p) => (
            <div key={p.prescriptionId} className="p-3 rounded-lg border hover:bg-muted/30 flex justify-between items-center">
              <div>
                <p><strong>Patient:</strong> {p.patientName}</p>
                <p><strong>Appointment Id:</strong> {p.appointmentId}</p>
                
                <p><strong>Date:</strong> {p.dateIssued?.slice(0, 10)}</p>

                <p><strong>Notes:</strong> {p.notes}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditPrescription(p)}>
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeletePrescription(p.prescriptionId)}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>
          )) : <p>No prescriptions found</p>}
        </CardContent>
      </Card>

      {/* Add Prescription Modal */}
      {modalOpen && (
        <div className="fixed inset-0 back bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background modal p-6 rounded-lg max-w-md space-y-4 shadow-lg">
            <h2 className="text-xl font-bold mb-2">Add Prescription</h2>
            <form onSubmit={handleAddPrescription} className="space-y-4">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter notes" required className="w-full border rounded px-2 py-1" />
              </div>
              <div className="space-y-1">
                <Label>Patient</Label>
                <select className="w-full border rounded px-2 py-1" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} required>
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.patientId} value={p.patientId}>{p.patientName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Appointment</Label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={selectedAppointmentId}
                  onChange={e => setSelectedAppointmentId(e.target.value)}
                  required
                >
                  <option value="">Select appointment</option>
                  {appointments.map(app => (
                    <option key={app.appointmentId} value={app.appointmentId}>
                      {`ID: ${app.appointmentId} - ${app.patientName} (${formatDateTime(app.appointmentDate)})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
                <Button type="submit">Add Prescription</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prescription Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 back bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background modal p-6 rounded-lg max-w-md space-y-4 shadow-lg">
            <h2 className="text-xl font-bold mb-2">Edit Prescription</h2>
            <form onSubmit={handleEditPrescription} className="space-y-4">
              <div className="space-y-1">
                <Label>Patient</Label>
                <select className="w-full border rounded px-2 py-1" value={editPatientId} onChange={(e) => setEditPatientId(e.target.value)} required>
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.patientId} value={p.patientId}>{p.patientName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full border rounded px-2 py-1" required />
              </div>
              <div className="space-y-1">
                <Label>Appointment</Label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={editAppointmentId}
                  onChange={e => setEditAppointmentId(e.target.value)}
                  required
                >
                  <option value="">Select appointment</option>
                  {appointments.map(app => (
                    <option key={app.appointmentId} value={app.appointmentId}>
                      {`ID: ${app.appointmentId} - ${app.patientName} (${formatDateTime(app.appointmentDate)})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)} type="button">Cancel</Button>
                <Button type="submit">Update Prescription</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
