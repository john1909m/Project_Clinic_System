import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, User, Calendar, FileText, Loader2, X } from "lucide-react";
import "./dashboard.css";

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formFields, setFormFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const [doctorsRes, patientsRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        fetch("http://localhost:8080/doctors", { headers }),
        fetch("http://localhost:8080/patients", { headers }),
        fetch("http://localhost:8080/appointments", { headers }),
        fetch("http://localhost:8080/prescriptions", { headers }),
      ]);

      if (!doctorsRes.ok) throw new Error("Failed to load doctors");
      if (!patientsRes.ok) throw new Error("Failed to load patients");
      if (!appointmentsRes.ok) throw new Error("Failed to load appointments");
      if (!prescriptionsRes.ok) throw new Error("Failed to load prescriptions");

      setDoctors(await doctorsRes.json());
      setPatients(await patientsRes.json());
      setAppointments(await appointmentsRes.json());
      setPrescriptions(await prescriptionsRes.json());
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);

    if (item) {
      const fields = getFormFieldsFromItem(type, item);
      setFormFields(fields);
      setIsEditMode(true);
    } else {
      setFormFields(getDefaultFields(type));
      setIsEditMode(false);
    }

    setModalOpen(true);
  };

  const getDefaultFields = (type) => {
    const defaults = {
      appointment: { patientId: "", doctorId: "", appointmentDate: "" },
      prescription: { patientId: "", doctorId: "", notes: "" },
      doctor: { username: "", email: "", password: "", doctorName: "", doctorPhone: "", attendTime: "", leaveTime: "",workingDays: []  },
      patient: { username: "", email: "", password: "", patientName: "", patientPhone: "", patientGender: "male", patientAge: 0 ,patientStatus:""},
    };
    return defaults[type] || {};
  };

  const getFormFieldsFromItem = (type, item) => {
    if (type === "doctor") {
      return {
        doctorId: item.doctorId,
        doctorName: item.doctorName,
        doctorPhone: item.doctorPhone,
        attendTime: item.attendTime,
        leaveTime: item.leaveTime,
        username: item.username,
        email: item.email,
        workingDays: item.workingDays || []
      };
    } else if (type === "patient") {
      return {
        patientId: item.patientId,
        patientName: item.patientName,
        patientPhone: item.patientPhone,
        patientGender: item.patientGender,
        patientAge: item.patientAge,
        username: item.username,
        email: item.email,
        patientStatus: item.patientStatus || ""
      };
    } else if (type === "appointment") {
          let formattedDate = "";
    if (item.appointmentDate) {
      const d = new Date(item.appointmentDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      formattedDate = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }
    return {
      appointmentId: item.appointmentId,
      patientId: item.patientId || item.patient?.patientId || "",
      doctorId: item.doctorId || item.doctor?.doctorId || "",
      doctorName: item.doctor?.doctorName || "",
      patientName: item.patient?.patientName || "",
      appointmentDate: formattedDate
    };
    } else if (type === "prescription") {
      return {
        prescriptionId: item.prescriptionId,
        patientId: item.patientId || item.patient?.patientId || "",
        doctorId: item.doctorId || item.doctor?.doctorId || "",
        patientName: item.patient?.patientName || "",
        doctorName: item.doctor?.doctorName || "",
        notes: item.notes || "",
      };
    }
    return {};
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormFields({});
    setSubmitting(false);
    setIsEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const configs = {
        doctor: { url: "http://localhost:8080/admin/add/user", method: "POST" },
        patient: { url: "http://localhost:8080/admin/add/user", method: "POST" },
        appointment: { url: "http://localhost:8080/appointment/add", method: "POST" },
        prescription: { url: "http://localhost:8080/prescription/add", method: "POST" },
      };

      let cfg = configs[modalType];
      if (!cfg) throw new Error("Unknown modal type");

      if (isEditMode) {
        if (modalType === "doctor") cfg = { url: "http://localhost:8080/doctor/update", method: "PUT" };
        if (modalType === "patient") cfg = { url: "http://localhost:8080/patient/update", method: "PUT" };
        if (modalType === "appointment") cfg = { url: "http://localhost:8080/appointment/update", method: "PUT" };
        if (modalType === "prescription") cfg = { url: "http://localhost:8080/prescription/update", method: "PUT" };
      }

      let body = { ...formFields };

      // Doctor Add
      if (modalType === "doctor" && !isEditMode) {
        body = {
          username: formFields.username.trim(),
          email: formFields.email.trim(),
          password: formFields.password,
          doctor: {
            doctorName: formFields.doctorName.trim(),
            doctorPhone: formFields.doctorPhone.trim(),
            attendTime: `${formFields.attendTime.trim()}:00`,
            leaveTime: `${formFields.leaveTime.trim()}:00`,
            workingDays: formFields.workingDays || []
          },
          role: "DOCTOR",
        };
      }

      // Patient Add
      if (modalType === "patient" && !isEditMode) {
        body = {
          username: formFields.username.trim(),
          email: formFields.email.trim(),
          password: formFields.password,
          patient: {
            patientName: formFields.patientName.trim(),
            patientPhone: formFields.patientPhone.trim(),
            patientGender: formFields.patientGender,
            patientAge: Number(formFields.patientAge),
            patientStatus: formFields.patientStatus || ""
          },
          role: "PATIENT",
        };
      }

      // Appointment Add/Edit
      if (modalType === "appointment") {
        const selectedPatient = patients.find(p => String(p.patientId) === String(formFields.patientId));
        const selectedDoctor = doctors.find(d => String(d.doctorId) === String(formFields.doctorId));

        body = {
          appointmentId: formFields.appointmentId,
          patientId: formFields.patientId,
          doctorId: formFields.doctorId,
          patientName: selectedPatient ? selectedPatient.patientName || selectedPatient.username : "",
          doctorName: selectedDoctor ? selectedDoctor.doctorName || selectedDoctor.username : "",
          appointmentDate: formFields.appointmentDate
        };
      }

      // Prescription Add/Edit
      if (modalType === "prescription") {
        const selectedPatient = patients.find(p => String(p.patientId) === String(formFields.patientId));
        const selectedDoctor = doctors.find(d => String(d.doctorId) === String(formFields.doctorId));

        body = {
          prescriptionId: formFields.prescriptionId,
          patientId: formFields.patientId,
          doctorId: formFields.doctorId,
          patientName: selectedPatient ? selectedPatient.patientName || selectedPatient.username : "",
          doctorName: selectedDoctor ? selectedDoctor.doctorName || selectedDoctor.username : "",
          notes: formFields.notes || "",
        };
      }

      const res = await fetch(cfg.url, {
        method: cfg.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errorMsg = "Request failed";
        try {
          const data = await res.json();
          if (data && (data.message_en || data.message_ar)) {
            errorMsg = `${data.message_en || ""}${data.message_ar ? " | " + data.message_ar : ""}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorMsg = text;
        }
        toast({ title: "Operation failed", description: errorMsg, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      toast({ title: `${modalType.charAt(0).toUpperCase() + modalType.slice(1)} saved successfully!` });
      await fetchData();
      closeModal();
    } catch (err) {
      toast({ title: "Operation failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type) => {
    const icons = { doctor: Users, patient: User, appointment: Calendar, prescription: FileText };
    return icons[type] || Users;
  };

  const getCardData = (type) => {
    const data = { doctor: doctors, patient: patients, appointment: appointments, prescription: prescriptions };
    return data[type] || [];
  };

  const handleEdit = (item, type) => {
    openModal(type, item);
  };

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

  const DataRow = ({ item, type }) => {
    const getDisplayText = () => {
      switch (type) {
        case "doctor": return `${item.doctorName || item.username || "—"} - ${item.doctorPhone || ""} - ${formatTime(item.attendTime) || ""} to ${formatTime(item.leaveTime) || ""} [${(item.workingDays || []).join(", ")}]`;
        case "patient": return `${item.patientName || item.username || "—"} - Status: ${item.patientStatus || ""} - Phone: ${item.patientPhone || ""}`;
        case "appointment": return `ID: ${item.appointmentId} - Patient: ${item.patientName || item.patient?.patientName || "—"} - Date: ${formatDate(item.appointmentDate)} with Dr.${item.doctorName || item.doctor?.doctorName || "—"}`;
        default: return item.name || "Unknown";
      }
    };

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium truncate">{getDisplayText()}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(item, type)}>Edit</Button>
          {["appointment", "prescription"].includes(type) && (
            <Button size="sm" variant="destructive" onClick={() => handleDelete(item, type)}>Delete</Button>
          )}
        </div>
      </div>
    );
  };

  const handleDelete = async (item, type) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    let url = "";
    if (type === "appointment") url = `http://localhost:8080/appointment/delete/${item.appointmentId}`;
    if (type === "prescription") url = `http://localhost:8080/prescription/delete/${item.prescriptionId}`;

    try {
      const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted!` });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const DataCard = ({ type, title }) => {
    const Icon = getIcon(type);
    const data = getCardData(type);

    return (
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2"><Icon className="h-5 w-5" />{title}</CardTitle>
            <CardDescription>{data.length} total</CardDescription>
          </div>
          <Button onClick={() => openModal(type)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />Add
          </Button>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {data.length > 0 ? data.map((item, idx) => <DataRow key={idx} item={item} type={type} />) : (
              <div className="text-center text-muted-foreground py-4">No {type}s found</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    let suffix = "AM";
    if (hours >= 12) {
      suffix = "PM";
      if (hours > 12) hours -= 12;
    }
    if (hours === 0) hours = 12;
    return `${d.toLocaleDateString()} ${hours}:${minutes}:${seconds} ${suffix}`;
  } catch {
    return dateStr;
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your healthcare system efficiently</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DataCard type="doctor" title="Doctors" />
          <DataCard type="patient" title="Patients" />
          <DataCard type="appointment" title="Appointments" />
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute back inset-0 bg-white/30 backdrop-blur-sm"></div>
            <div className="relative modal w-fit rounded-xl max-w-md max-h-[80vh] overflow-y-auto shadow-2xl bg-white">
              <div className="flex items-center bg-white justify-between p-6 border-b">
                <h2 className="text-xl font-semibold capitalize">{isEditMode ? "Edit" : "Add"} {modalType}</h2>
                <Button variant="ghost" size="icon" onClick={closeModal}><X className="h-4 w-4" /></Button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Doctor Form */}
                {modalType === "doctor" && (
                  <>
                    {!isEditMode && (
                      <>
                      
                        <div className="flex flex-col">
                          <label htmlFor="username">Username</label>
                          <input type="text" name="username" className="input_add"
                            value={formFields.username || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                          <label htmlFor="email">Email</label>
                          <input type="email" name="email" className="input_add"
                            value={formFields.email || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                          <label htmlFor="password">Password</label>
                          <input type="password" name="password" className="input_add"
                            value={formFields.password || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div className="flex flex-col">
                      <label htmlFor="doctorName">Doctor Name</label>
                      <input type="text" name="doctorName" className="input_add"
                        value={formFields.doctorName || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="doctorPhone">Phone</label>
                      <input type="text" name="doctorPhone" className="input_add"
                        value={formFields.doctorPhone || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                    </div>
                    <div className="flex flex-col mt-2">
                      <label>Working Days</label>
                      <div className="flex flex-wrap gap-2">
                        {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(day => (
                          <label key={day} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={formFields.workingDays?.includes(day)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setFormFields(prev => ({
                                  ...prev,
                                  workingDays: checked
                                    ? [...(prev.workingDays || []), day]
                                    : (prev.workingDays || []).filter(d => d !== day)
                                }));
                              }}
                            />
                            {day}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="bg-red-400 clinicDate mb-4">The Clinic is Open from 7:00 AM to 11:59 PM</p> 
                      <label htmlFor="attendTime">Attend Time</label>
                      <input type="time" name="attendTime" className="input_add"
                        value={formFields.attendTime || ""} onChange={(e) => setFormFields({ ...formFields, attendTime: e.target.value })} />
                    </div>
                    <div className="flex flex-col mt-2">
                      <label htmlFor="leaveTime">Leave Time</label>
                      <input type="time" name="leaveTime" className="input_add"
                        value={formFields.leaveTime || ""} onChange={(e) => setFormFields({ ...formFields, leaveTime: e.target.value })} />
                    </div>
                  </>
                )}

                {/* Patient Form */}
                {modalType === "patient" && (
                  <>
                    {!isEditMode && (
                      <>
                        <div className="flex flex-col">
                          <label htmlFor="username">Username</label>
                          <input type="text" name="username" className="input_add"
                            value={formFields.username || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                          <label htmlFor="email">Email</label>
                          <input type="email" name="email" className="input_add"
                            value={formFields.email || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                          <label htmlFor="password">Password</label>
                          <input type="password" name="password" className="input_add"
                            value={formFields.password || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div className="flex flex-col">
                      <label htmlFor="patientName">Patient Name</label>
                      <input type="text" name="patientName" className="input_add"
                        value={formFields.patientName || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="patientPhone">Phone</label>
                      <input type="text" name="patientPhone" className="input_add"
                        value={formFields.patientPhone || ""} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="patientGender">Gender</label>
                      <select name="patientGender" className="input_add"
                        value={formFields.patientGender} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="patientAge">Age</label>
                      <input type="number" name="patientAge" className="input_add"
                        value={formFields.patientAge || 0} onChange={(e) => setFormFields({ ...formFields, [e.target.name]: e.target.value })} />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="patientStatus">Patient Status</label>
                      <textarea
                        name="patientStatus"
                        className="input_add"
                        rows={3}
                        value={formFields.patientStatus || ""}
                        onChange={(e) => setFormFields({ ...formFields, patientStatus: e.target.value })}
                      ></textarea>
                    </div>
                  </>
                )}

                {/* Appointment Form */}
                {modalType === "appointment" && (
                  <>
                    <div className="flex flex-col">
                      <p className="bg-red-400 clinicDate mb-4">The Clinic is Open from 7:00 AM to 11:59 PM</p>
                      <label htmlFor="patientId">Patient</label>
                      <select name="patientId" className="input_add"
                      value={formFields.patientId}
                      onChange={(e) => setFormFields({ ...formFields, patientId: e.target.value })}>
                      <option value="">Select Patient</option>
                      {patients.map(p => (
                        <option key={p.patientId} value={String(p.patientId)}>
                          {p.patientName || p.username}
                        </option>
                      ))}
                    </select>
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="doctorId">Doctor</label>
                      <select name="doctorId" className="input_add"
                        value={formFields.doctorId}
                        onChange={(e) => setFormFields({ ...formFields, doctorId: e.target.value })}>
                        <option value="">Select Doctor</option>
                        {doctors.map(d => (
                          <option key={d.doctorId} value={String(d.doctorId)}>
                            {d.doctorName} - Available:  {`${d.attendTime} - ${d.leaveTime} - available on ${d.workingDays || "N/A"}`}
                          </option>
                        ))}
                      </select> 
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="appointmentDate">Date & Time</label>
                      <input type="datetime-local" name="appointmentDate" className="input_add"
                        value={formFields.appointmentDate || ""} onChange={(e) => setFormFields({ ...formFields, appointmentDate: e.target.value })} />
                    </div>
                  </>
                )}

                {/* Prescription Form */}
                {modalType === "prescription" && (
                  <>
                    <div className="flex flex-col">
                      <label htmlFor="patientId">Patient</label>
                      <select name="patientId" className="input_add"
                        value={formFields.patientId} onChange={(e) => setFormFields({ ...formFields, patientId: e.target.value })}>
                        <option value="">Select Patient</option>
                        {patients.map(p => <option key={p.patientId} value={p.patientId}>{p.patientName || p.username}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="doctorId">Doctor</label>
                      <select name="doctorId" className="input_add"
                        value={formFields.doctorId} onChange={(e) => setFormFields({ ...formFields, doctorId: e.target.value })}>
                        <option value="">Select Doctor</option>
                        {doctors.map(d => <option key={d.doctorId} value={d.doctorId}>{d.doctorName || d.username}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="notes">Notes</label>
                      <textarea name="notes" className="input_add" rows={3}
                        value={formFields.notes || ""} onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}></textarea>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
