import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  TableContainer,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CircularBubbleLoading from "../../../Components/loading";
import { z } from "zod";
import DeleteIcon from "@mui/icons-material/Delete";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import {
  getDesignation,
  getLanguages,
  getEmpStatus,
  postEmployee,
  postEmployeelanguage,
  getDocuments,
  updateEmployee,
  uploadEmployeeDocuments,
  getEmployeeUploadedDocuments,
  getEmployeeUploadedDocumentsPreview,
  deleteEmployeeUploadedDocuments,
} from "../../../Services/Employee.services";
import {
  showPostSuccess,
  showPostError,
  deleteAlert,
  invalidDocFormatAlert,
  invalidDocSizeAlert,
  deleteErrorAlert,
} from "../../../Components/swal_alert";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";

// Display months in uppercase abbreviations in the date picker
dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  months: [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ],
});

// DatePicker field styles — adjusts label and border for dark and light mode
const datePickerStyle = (theme) => ({
  "& .MuiPickersSectionList-root": {
    height: "16px",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiInputLabel-outlined": {
    height: "11px",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiPickersOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
      borderWidth: "1px",
      borderRadius: "5px",
    },
  },
});

import {
  EMAIL_REGEX,
  PHONE_REGEX,
  AADHAAR_REGEX,
  PAN_REGEX,
} from "../../../Components/validation";

/**
 * Zod validation schema for sensitive employee fields.
 * Validates email addresses, phone numbers, Aadhaar, and PAN format.
 */
export const employeeSchema = z.object({
  personalEmail: z
    .string()
    .min(1, "Personal email is required")
    .regex(EMAIL_REGEX, "Invalid email format"),

  officeEmail: z
    .string()
    .min(1, "Office email is required")
    .regex(EMAIL_REGEX, "Invalid email format"),

  mobileNumber: z
    .string()
    .min(1, "Mobile number is required")
    .regex(PHONE_REGEX, "Invalid mobile number"),

  alternativeMobileNumber: z
    .string()
    .min(1, "Alternate mobile number is required")
    .regex(PHONE_REGEX, "Invalid mobile number"),

  aadhar: z
    .string()
    .min(1, "Aadhaar number is required")
    .regex(AADHAAR_REGEX, "Aadhaar must be exactly 12 digits"),

  pan: z
    .string()
    .min(1, "PAN number is required")
    .regex(PAN_REGEX, "PAN must be in format ABCDE1234F"),
});

// Visually hidden input used to trigger the file picker via a styled Button
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

/**
 * EmployeeForm
 * Renders the full employee add/edit form including personal details,
 * language proficiency table, and document upload section.
 *
 * Props:
 *   editRowData    - Array of employee row data for edit mode. Empty or null for add mode.
 *   setEditRowData - Callback to clear edit state in the parent after update or clear.
 *   refreshTable   - Callback to reload the employee grid after save or update.
 */
export default function EmployeeForm({
  editRowData,
  setEditRowData,
  refreshTable,
}) {
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    qualification: "",
    mobileNumber: "",
    alternativeMobileNumber: "",
    personalEmail: "",
    officeEmail: "",
    Address: "",
    dob: null,
    dojo: null,
    aadhar: "",
    pan: "",
  });

  // Edit mode is active when editRowData contains at least one employee record
  const isEditMode = Boolean(editRowData && editRowData.length > 0);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [designation, setDesignation] = useState([]);
  const [desgId, setDesgId] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [empStatus, setEmpStatus] = useState([]);
  const [openReasonPopup, setOpenReasonPopup] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [selectedEmpStatus, setselectedEmpStatus] = useState(null);
  const [addLanguages, setAddLanguages] = useState("");
  const [documentTypes, setDocumentTypes] = useState([]);
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [langPermission, setLangPermission] = useState({
    speak: false,
    read: false,
  });
  const [uploadEmployeeDocs, setUploadEmployeeDocs] = useState([]);
  const [uploadedEmployeeDocs, setUploadedEmployeeDocs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [langTableData, setLangTableData] = useState([]);

  // In edit mode, exclude document types already uploaded to avoid duplicates
  const availableDocumentTypes = isEditMode
    ? documentTypes.filter(
        (doc) => !uploadedEmployeeDocs.some((u) => u.DOC_ID === doc.DOC_ID),
      )
    : documentTypes;

  // Fetches designation dropdown options from the API
  const getDesignationList = async () => {
    try {
      const response = await getDesignation();
      setDesignation(response?.items || []);
    } catch (error) {
      console.error(error);
      setDesignation([]);
    }
  };

  // Fetches language dropdown options from the API
  const getLanguagesList = async () => {
    try {
      const response = await getLanguages();
      setLanguages(response?.items || []);
    } catch (error) {
      console.error(error);
      setLanguages([]);
    }
  };

  // Fetches employee status dropdown options from the API
  const getEmpStatusList = async () => {
    try {
      const response = await getEmpStatus();
      setEmpStatus(response?.items || []);
    } catch (error) {
      console.error(error);
      setEmpStatus([]);
    }
  };

  // Fetches document type dropdown options from the API
  const getDocumentsList = async () => {
    try {
      const response = await getDocuments();
      setDocumentTypes(response?.items || []);
    } catch (error) {
      console.error(error);
      setDocumentTypes([]);
    }
  };

  // Load all dropdown data on component mount
  useEffect(() => {
    getDesignationList();
    getLanguagesList();
    getEmpStatusList();
    getDocumentsList();
  }, []);

  /**
   * Validates individual form fields in real time as the user types.
   * Updates both formData and formErrors state on each keystroke.
   */
  const realTimeValidtation = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    let error = "";

    if (name === "Name") {
      if (value.length < 4) {
        error = "Name must be at least 4 characters";
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        error = "Only alphabets allowed";
      } else {
        error = "";
      }
    }

    // Validates that the gap between DOB and DOJ is at least 18 years
    if (name === "dojo" || name === "dob") {
      const dob = dayjs(name === "dob" ? value : formData.dob, "DD-MMM-YYYY");
      const dojo = dayjs(
        name === "dojo" ? value : formData.dojo,
        "DD-MMM-YYYY",
      );

      if (dob.isValid() && dojo.isValid()) {
        const diffYears = dojo.diff(dob, "year");

        if (diffYears < 18) {
          error = "Must have a minimum 18-year gap";
        }
      }
    }

    if (name === "mobileNumber" || name === "alternativeMobileNumber") {
      if (!/^\d*$/.test(value)) {
        error = "Only digits allowed";
      } else if (value.length > 0 && value.length < 10) {
        error = "Enter 10 digit phone number";
      } else if (value.length === 10 && !/^[6-9]\d{9}$/.test(value)) {
        error = "Invalid mobile number";
      } else {
        error = "";
      }

      // Cross-field validation — alternate number must differ from primary number
      const otherField =
        name === "mobileNumber"
          ? formData.alternativeMobileNumber
          : formData.mobileNumber;

      if (
        value.length === 10 &&
        otherField.length === 10 &&
        value === otherField
      ) {
        error = "Alternate number must be different";
      }
    }

    if (name === "personalEmail" || name === "officeEmail") {
      if (value === "") {
        error = "Email is required";
      } else if (!EMAIL_REGEX.test(value)) {
        error = "Invalid email format";
      } else {
        error = "";
      }
    }

    if (["qualification", "Address"].includes(name)) {
      if (!value.trim()) {
        error = `${name} is required`;
      } else if (name === "Address" && value.length > 200) {
        error = "Address cannot exceed 200 characters";
      }
    }

    if (name === "aadhar") {
      if (!/^\d*$/.test(value)) {
        error = "Only digits allowed";
      } else if (value.length > 0 && value.length < 12) {
        error = "Aadhaar must be 12 digits";
      } else if (value.length === 12 && !AADHAAR_REGEX.test(value)) {
        error = "Invalid Aadhaar number";
      }
    }

    if (name === "pan") {
      if (value.length > 0 && value.length < 10) {
        error = "PAN must be 10 characters";
      } else if (value.length === 10 && !PAN_REGEX.test(value)) {
        error = "Invalid PAN format (ABCDE1234F)";
      }
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  /**
   * Handles date picker changes for DOB and DOJ fields.
   * Formats the selected date and validates the 18-year gap between both dates.
   */
  const handleDateChange = (field, value) => {
    const formatted = value ? dayjs(value).format("DD-MMM-YYYY") : "";

    setFormData((prev) => ({
      ...prev,
      [field]: formatted,
    }));

    let error = "";

    const dob = dayjs(
      field === "dob" ? formatted : formData.dob,
      "DD-MMM-YYYY",
    );
    const dojo = dayjs(
      field === "dojo" ? formatted : formData.dojo,
      "DD-MMM-YYYY",
    );

    if (!formatted) {
      error = `${
        field === "dob" ? "Date of Birth" : "Date of Joining"
      } is required`;
    }

    if (dob.isValid() && dojo.isValid()) {
      const diffYears = dojo.diff(dob, "year");

      if (diffYears < 18) {
        error = "Must have a minimum 18-year gap";
      }
    }

    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  /**
   * Posts a new language entry to the API and refreshes the language dropdown.
   * Validates that the language field is not empty before submitting.
   */
  const postLanguages = async () => {
    if (!addLanguages || addLanguages.trim() === "") {
      await showPostError("Language field cannot be empty");
      return;
    }
    setIsLoading(true);

    try {
      const payload = {
        LANG_NAME: addLanguages.trim(),
      };

      const res = await postEmployeelanguage(payload);

      if (res?.Status === 1 || res?.statusCode === 201) {
        await showPostSuccess("Language added successfully");
        await getLanguagesList();
        setAddLanguages("");
      }
    } catch (error) {
      console.error(error);
      await showPostError("Unable to add language");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets all edit-mode dependent state fields
   * without affecting the main form data.
   * Called before populating the form with edit data.
   */
  const resetEditDependentFields = () => {
    setSelectedLanguages(null);
    setEmployeeDocuments([]);
    setUploadEmployeeDocs([]);
    setLangPermission({ speak: false, read: false });
    setLangTableData([]);
  };

  // Populates form fields and language table when an employee is selected for editing
  useEffect(() => {
    if (!editRowData || editRowData.length === 0) {
      resetEditDependentFields();
      return;
    }
    const emp = editRowData[0];
    resetEditDependentFields();
    setFormData({
      Name: emp.NAME ?? "",
      qualification: emp.QUALIFICATION ?? "",
      mobileNumber: emp.MOBILE ? Number(emp.MOBILE) : "",
      alternativeMobileNumber: emp.ALT_MOBILE ? Number(emp.ALT_MOBILE) : "",
      personalEmail: emp.EMAIL_ID ?? "",
      officeEmail: emp.OFF_EMAIL_ID ?? "",
      Address: emp.ADDRESS ?? "",
      dob: emp.DOB ? dayjs(emp.DOB).format("DD-MMM-YYYY") : null,
      dojo: emp.DOJ ? dayjs(emp.DOJ).format("DD-MMM-YYYY") : null,
      aadhar: emp.AADHAR ?? "",
      pan: emp.PAN ?? "",
    });

    setDesgId(emp.DESG_ID ?? null);

    // Match the employee's status string to the status dropdown option object
    if (emp.STATUS && empStatus.length > 0) {
      const matchedStatus = empStatus.find((s) => s.status_name === emp.STATUS);
      setselectedEmpStatus(matchedStatus ?? null);
    }

    // Build the language table from all rows of editRowData that have a LANG_ID
    const langs = editRowData
      .filter((r) => r.LANG_ID)
      .map((r) => {
        const langMaster = languages.find((l) => l.lang_id === r.LANG_ID);

        return {
          lang_id: r.LANG_ID,
          lang_name: langMaster?.lang_name || "Unknown",
          read: r.READ === "Y",
          speak: r.SPEAK === "Y",
        };
      });

    setLangTableData(langs);
  }, [editRowData, languages, empStatus]);

  /**
   * Validates the selected file for allowed type and max size (1 MB).
   * Assigns the file to the next pending document slot in uploadEmployeeDocs.
   */
  const handleTopUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const MAX_SIZE = 1 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      invalidDocFormatAlert();
      event.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      invalidDocSizeAlert();
      event.target.value = "";
      return;
    }

    // Find the first document slot that has no file assigned yet
    const nextPending = uploadEmployeeDocs.find((d) => !d.file);

    if (!nextPending) {
      showPostError("All selected documents already have files");
      event.target.value = "";
      return;
    }

    setUploadEmployeeDocs((prev) =>
      prev.map((d) => (d.docId === nextPending.docId ? { ...d, file } : d)),
    );

    event.target.value = "";
  };

  /**
   * Fetches a blob preview of an already-uploaded employee document from the server.
   * Creates an object URL from the blob and stores it for rendering in the dialog.
   */
  const handlePreviewDocument = async (doc) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);

    try {
      const blob = await getEmployeeUploadedDocumentsPreview(
        doc.EMP_DOC_LINK_ID,
      );
      const fileUrl = URL.createObjectURL(blob);
      setPreviewUrl(fileUrl);
    } catch (error) {
      console.error("Preview failed", error);
      showPostError("Could not load document preview");
    }
  };

  /**
   * Validates and submits the form to create a new employee record.
   * Uploads attached documents after the employee record is created successfully.
   */
  const submitForm = async (e) => {
    e.preventDefault();

    const isEmpty = (v) => v === "" || v === null || v === undefined;
    let errors = {};

    // Run Zod schema validation on sensitive fields
    const zodResult = employeeSchema.safeParse(formData);
    if (!zodResult.success) {
      const zodErrors = zodResult.error.flatten().fieldErrors;
      Object.keys(zodErrors).forEach((key) => {
        errors[key] = zodErrors[key][0];
      });
    }

    // Check required plain text fields not covered by Zod
    ["Name", "qualification", "Address"].forEach((field) => {
      if (isEmpty(formData[field])) {
        errors[field] = `${field} is required`;
      }
    });

    if (!formData.dob) errors.dob = "Date of birth is required";
    if (!formData.dojo) errors.dojo = "Date of joining is required";

    // Show alerts for required dropdown selections before setting field errors
    if (!selectedEmpStatus) {
      await showPostError("Please select Employee Status");
      return;
    }

    if (!desgId) {
      await showPostError("Please select Designation");
      return;
    }

    if (langTableData.length === 0) {
      await showPostError("Please add at least one language");
      return;
    }
    if (uploadEmployeeDocs.length === 0) {
      await showPostError("Please upload at least one document");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsLoading(true);

    const payload = {
      employee: {
        Name: formData.Name,
        dob: formData.dob,
        dojo: formData.dojo,
        designationId: desgId,
        mobileNumber: formData.mobileNumber,
        alternativeMobileNumber: formData.alternativeMobileNumber,
        personalEmail: formData.personalEmail,
        officeEmail: formData.officeEmail,
        Address: formData.Address,
        statusId: selectedEmpStatus.status_id,
        qualification: formData.qualification,
        aadhar: formData.aadhar,
        pan: formData.pan,
        STATUS_REASON: reasonText.trim(),
      },
      languages: langTableData.map((l) => ({
        langId: l.lang_id,
        read: l.read ? "Y" : "N",
        speak: l.speak ? "Y" : "N",
      })),
    };

    try {
      const res = await postEmployee(payload);

      if (res.Status !== 1) {
        await showPostError("Failed to save employee");
        return;
      }

      // Upload documents using the newly created employee ID
      const empId = res.items.empId;
      if (uploadEmployeeDocs.length > 0) {
        const files = uploadEmployeeDocs.map((d) => d.file);
        const docIds = uploadEmployeeDocs.map((d) => d.docId);

        await uploadEmployeeDocuments(empId, files, docIds);
      }

      await showPostSuccess("Form submitted successfully");
      refreshTable();
    } catch (error) {
      console.error(error);
      await showPostError(
        error?.response?.data?.message || "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetches previously uploaded documents for the employee being edited
  useEffect(() => {
    if (!editRowData || editRowData.length === 0) {
      setUploadedEmployeeDocs([]);
      return;
    }

    const empId = editRowData[0].EMP_ID;

    const fetchDocs = async () => {
      try {
        const res = await getEmployeeUploadedDocuments(empId);
        setUploadedEmployeeDocs(res.items || []);
      } catch (err) {
        console.error(err);
        setUploadedEmployeeDocs([]);
      }
    };

    fetchDocs();
  }, [editRowData]);

  /**
   * Validates and submits updated employee data to the API.
   * Also uploads any newly attached documents that were not previously saved.
   * Resets the form and clears edit mode on success.
   */
  const updateForm = async (e) => {
    e.preventDefault();
    let errors = {};

    // Required field validation for update mode
    if (!formData.Name?.trim()) errors.Name = "Name is required";
    if (!formData.qualification?.trim())
      errors.qualification = "Qualification is required";
    if (!formData.Address?.trim()) errors.Address = "Address is required";

    if (!formData.dob) errors.dob = "Date of birth is required";
    if (!formData.dojo) errors.dojo = "Date of joining is required";
    if (!formData.aadhar) errors.aadhar = "Aadhar number is required";
    if (!formData.pan) errors.pan = "PAN number is required";

    if (!selectedEmpStatus) {
      await showPostError("Please select Employee Status");
      return;
    }

    if (!desgId) {
      await showPostError("Please select Designation");
      return;
    }

    // Stop submission if any field errors were found
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      const empId = editRowData[0].EMP_ID;
      const payload = {
        employee: {
          Name: formData.Name,
          dob: formData.dob,
          dojo: formData.dojo,
          designationId: desgId,
          mobileNumber: formData.mobileNumber,
          alternativeMobileNumber: formData.alternativeMobileNumber,
          personalEmail: formData.personalEmail,
          officeEmail: formData.officeEmail,
          Address: formData.Address,
          statusId: selectedEmpStatus?.status_id,
          qualification: formData.qualification,
          aadhar: formData.aadhar,
          pan: formData.pan,
          STATUS_REASON: reasonText.trim(),
        },
        languages: langTableData.map((l) => ({
          langId: l.lang_id,
          read: l.read ? "Y" : "N",
          speak: l.speak ? "Y" : "N",
        })),
      };
      setIsLoading(true);

      const res = await updateEmployee(empId, payload);

      if (res?.statusCode !== 200 && res?.Status !== 1) {
        await showPostError("Employee update failed");
        return;
      }

      // Upload only documents that were newly added during this edit session
      const newDocs = uploadEmployeeDocs.filter((d) => d.file);

      if (newDocs.length > 0) {
        const files = newDocs.map((d) => d.file);
        const docIds = newDocs.map((d) => d.docId);

        await uploadEmployeeDocuments(empId, files, docIds);
      }

      await showPostSuccess("Employee updated successfully");
      refreshTable();

      // Refresh the uploaded documents list after update
      const docsRes = await getEmployeeUploadedDocuments(empId);
      setUploadedEmployeeDocs(docsRes.items || []);

      // Reset all form fields and state after a successful update
      setFormData({
        Name: "",
        qualification: "",
        mobileNumber: "",
        alternativeMobileNumber: "",
        personalEmail: "",
        officeEmail: "",
        Address: "",
        dob: null,
        dojo: null,
        aadhar: "",
        pan: "",
      });

      setFormErrors({});
      setselectedEmpStatus(null);
      setReasonText("");
      setDesgId(null);
      setSelectedLanguages(null);
      setLangPermission({ speak: false, read: false });
      setLangTableData([]);
      setShowAddLanguage(false);
      setEditRowData(null);
      setUploadEmployeeDocs([]);
      setEmployeeDocuments([]);
    } catch (error) {
      console.error(error);
      await showPostError("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Prompts for confirmation, then deletes a single uploaded document
   * for the currently edited employee.
   * Updates local state to reflect the deletion without a full refetch.
   */
  const DeleteSingleUploadedDoc = async (empId, docLinkId) => {
    if (!empId) {
      showPostError("Employee not selected");
      return;
    }

    const result = await deleteAlert("Do you want to delete this document?");
    if (!result.isConfirmed) return;
    setIsLoading(true);

    try {
      const res = await deleteEmployeeUploadedDocuments(empId, docLinkId);

      if (res?.Status === 1) {
        // Remove the deleted document from all three relevant state arrays
        setUploadedEmployeeDocs((prev) =>
          prev.filter((d) => d.EMP_DOC_LINK_ID !== docLinkId),
        );

        setUploadEmployeeDocs((prev) =>
          prev.filter((d) => d.docLinkId !== docLinkId),
        );

        setEmployeeDocuments((prev) =>
          prev.filter(
            (d) =>
              !uploadedEmployeeDocs.some(
                (u) => u.EMP_DOC_LINK_ID === docLinkId && u.DOC_ID === d.DOC_ID,
              ),
          ),
        );
      } else {
        await deleteErrorAlert();
      }
    } catch (err) {
      console.error(err);
      await deleteErrorAlert();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets all form fields, errors, dropdowns, and language and document state.
   * Also clears edit mode in the parent by calling setEditRowData(null).
   */
  const ClearAllForm = (e) => {
    e.preventDefault();
    setFormData({
      Name: "",
      qualification: "",
      mobileNumber: "",
      alternativeMobileNumber: "",
      personalEmail: "",
      officeEmail: "",
      Address: "",
      dob: null,
      dojo: null,
      aadhar: "",
      pan: "",
    });

    setFormErrors({});
    setselectedEmpStatus(null);
    setReasonText("");
    setDesgId(null);
    setSelectedLanguages(null);
    setLangPermission({ speak: false, read: false });
    setLangTableData([]);
    setShowAddLanguage(false);
    setEditRowData(null);
    setUploadEmployeeDocs([]);
    setEmployeeDocuments([]);
  };

  return (
    <>
      {/* Full-screen loader shown during API calls */}
      {isLoading && <CircularBubbleLoading text="Processing" />}

      {/* ===== PERSONAL DETAILS SECTION ===== */}
      <Grid container spacing={2} component={Paper} p={2}>
        {/* Employee name input — forced uppercase */}
        <Grid size={{ xs: 12, sm: 5, md: 5 }}>
          <TextField
            label="Employee Name"
            name="Name"
            required
            onChange={(e) => {
              const upper = e.target.value.toUpperCase();
              realTimeValidtation({
                target: { name: "Name", value: upper },
              });
            }}
            value={formData.Name}
            error={!!formErrors.Name}
            helperText={formErrors.Name}
          />
        </Grid>

        {/* Employee status dropdown — opens a reason popup for resigned/terminated */}
        <Grid size={{ xs: 12, sm: 3, md: 3 }}>
          <Autocomplete
            options={empStatus}
            value={selectedEmpStatus}
            onChange={(event, newValue) => {
              if (!newValue) {
                setselectedEmpStatus(null);
                return;
              }

              // Prompt for a reason when status is resigned or terminated
              if (
                newValue.status_name.toLowerCase() === "resigned" ||
                newValue.status_name.toLowerCase() === "terminated"
              ) {
                setselectedEmpStatus(newValue);
                setOpenReasonPopup(true);
              } else {
                setselectedEmpStatus(newValue);
              }
            }}
            getOptionLabel={(option) => option?.status_name || ""}
            isOptionEqualToValue={(option, value) =>
              option?.status_id === value?.status_id
            }
            renderInput={(params) => <TextField {...params} label="Status" />}
          />

          {/* Reason popup — shown when status is resigned or terminated */}
          <Dialog
            open={openReasonPopup}
            onClose={() => setOpenReasonPopup(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Enter Reason
              <IconButton onClick={() => setOpenReasonPopup(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                autoFocus
              />
            </DialogContent>

            <Box display="flex" justifyContent="flex-end" p={2}>
              <Button
                onClick={() => setOpenReasonPopup(false)}
                variant="contained"
                color="primary"
                disabled={!reasonText.trim()}
              >
                Save
              </Button>
            </Box>
          </Dialog>
        </Grid>

        {/* Designation dropdown — value resolved from desgId against designation list */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <Autocomplete
            options={designation}
            getOptionLabel={(option) => option?.designation || ""}
            isOptionEqualToValue={(option, value) =>
              option?.desg_id === value?.desg_id
            }
            value={
              desgId
                ? designation.find((d) => d.desg_id === desgId) || null
                : null
            }
            onChange={(event, newValue) => {
              setDesgId(newValue?.desg_id ?? null);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Designation" />
            )}
            name="designation"
          />
        </Grid>

        {/* Date of Birth picker */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth *"
              format="DD-MMM-YYYY"
              value={formData.dob ? dayjs(formData.dob, "DD-MMM-YYYY") : null}
              onChange={(v) => handleDateChange("dob", v)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!formErrors.dob,
                  helperText: formErrors.dob,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Date of Joining picker */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Join * "
              name="dojo"
              format="DD-MMM-YYYY"
              value={formData.dojo ? dayjs(formData.dojo, "DD-MMM-YYYY") : null}
              onChange={(v) => handleDateChange("dojo", v)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!formErrors.dojo,
                  helperText: formErrors.dojo,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Qualification input — forced uppercase */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            label="Qualification"
            name="qualification"
            value={formData.qualification}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              realTimeValidtation({ target: { name: "qualification", value } });
            }}
            error={!!formErrors.qualification}
            helperText={formErrors.qualification}
            required
          />
        </Grid>

        {/* Primary mobile number input — 10 digit limit */}
        <Grid size={{ xs: 12, sm: 4.5, md: 3 }}>
          <TextField
            label="Mobile Number"
            name="mobileNumber"
            required
            value={formData.mobileNumber}
            inputProps={{ maxLength: 10 }}
            onChange={realTimeValidtation}
            error={!!formErrors.mobileNumber}
            helperText={formErrors.mobileNumber}
          />
        </Grid>

        {/* Alternate mobile number input — must differ from primary */}
        <Grid size={{ xs: 12, sm: 4.5, md: 3 }}>
          <TextField
            label="Alternate Number"
            name="alternativeMobileNumber"
            value={formData.alternativeMobileNumber}
            inputProps={{ maxLength: 10 }}
            onChange={realTimeValidtation}
            error={!!formErrors.alternativeMobileNumber}
            helperText={formErrors.alternativeMobileNumber}
            required
          />
        </Grid>

        {/* Aadhaar number input — 12 digit limit */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            label="AADHAR"
            name="aadhar"
            value={formData.aadhar}
            inputProps={{ maxLength: 12 }}
            onChange={realTimeValidtation}
            error={!!formErrors.aadhar}
            helperText={formErrors.aadhar}
            required
          />
        </Grid>

        {/* PAN number input — forced uppercase, 10 character limit */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            label="PAN"
            name="pan"
            value={formData.pan}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              realTimeValidtation({ target: { name: "pan", value } });
            }}
            error={!!formErrors.pan}
            helperText={formErrors.pan}
            inputProps={{ maxLength: 10 }}
            required
          />
        </Grid>

        {/* Personal email input */}
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <TextField
            label="Personal Email ID"
            name="personalEmail"
            value={formData.personalEmail}
            onChange={realTimeValidtation}
            error={!!formErrors.personalEmail}
            helperText={formErrors.personalEmail}
            required
          />
        </Grid>

        {/* Office email input */}
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <TextField
            label=" Office Email ID"
            name="officeEmail"
            value={formData.officeEmail}
            onChange={realTimeValidtation}
            error={!!formErrors.officeEmail}
            helperText={formErrors.officeEmail}
            required
          />
        </Grid>

        {/* Address textarea — max 200 characters */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <TextField
            label=" Address"
            name="Address"
            value={formData.Address}
            onChange={realTimeValidtation}
            error={!!formErrors.Address}
            helperText={formErrors.Address}
            multiline
            rows={2}
            required
          />
        </Grid>
      </Grid>

      {/* ===== LANGUAGE AND DOCUMENT SECTION ===== */}
      <Grid container spacing={2} component={Paper} p={2} mt={2}>
        {/* Language selector with Add Language toggle button */}
        <Grid
          size={{ xs: 12, md: 5.6 }}
          display={"flex"}
          justifyContent={"space-between"}
          gap={1}
        >
          <Autocomplete
            options={languages}
            value={selectedLanguages}
            sx={{ width: "97%" }}
            onChange={(e, val) => {
              setSelectedLanguages(val);
              setLangPermission({ speak: false, read: false });
            }}
            getOptionLabel={(option) =>
              option?.lang_name ? option.lang_name : `Lang-${option.lang_id}`
            }
            isOptionEqualToValue={(o, v) => o.lang_id === v.lang_id}
            renderInput={(params) => (
              <TextField {...params} label="Select Language" size="small" />
            )}
          />

          {/* Toggle button to show/hide the add new language input */}
          <Button
            variant="contained"
            size="small"
            sx={{ borderRadius: "3px", height: "30px" }}
            onClick={() => setShowAddLanguage(!showAddLanguage)}
          >
            <AddIcon />
          </Button>
        </Grid>

        {/* Speak and Read permission checkboxes for the selected language */}
        <Grid size={{ xs: 12, md: 4.4 }} mt={-1}>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={langPermission.speak}
                  onChange={(e) =>
                    setLangPermission((p) => ({
                      ...p,
                      speak: e.target.checked,
                    }))
                  }
                />
              }
              label="Speak"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={langPermission.read}
                  onChange={(e) =>
                    setLangPermission((p) => ({ ...p, read: e.target.checked }))
                  }
                />
              }
              label="Read"
            />
          </FormGroup>

          {/* Permission validation error shown when neither Speak nor Read is selected */}
          {formErrors.permission && (
            <Typography variant="caption" color="error">
              {formErrors.permission}
            </Typography>
          )}
        </Grid>

        {/* Add language to the table — validates selection and permissions before adding */}
        <Grid size={{ xs: 12, md: 2 }} textAlign={"right"}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => {
              if (!selectedLanguages) {
                showPostError("Please select a language");
                return;
              }

              if (!langPermission.speak && !langPermission.read) {
                showPostError("Select at least Speak or Read");
                return;
              }

              const alreadyAdded = langTableData.some(
                (l) => l.lang_id === selectedLanguages.lang_id,
              );

              if (alreadyAdded) {
                showPostError("Language already added");
                return;
              }

              setLangTableData((prev) => [
                ...prev,
                {
                  lang_id: selectedLanguages.lang_id,
                  lang_name: selectedLanguages.lang_name,
                  speak: langPermission.speak,
                  read: langPermission.read,
                },
              ]);

              setSelectedLanguages(null);
              setLangPermission({ speak: false, read: false });
            }}
          >
            Add
          </Button>
        </Grid>

        {/* Add new language input — only visible when the + button is toggled on */}
        {showAddLanguage && (
          <Grid size={{ xs: 12, md: 12 }}>
            <>
              <Grid container>
                {/* New language name input — forced uppercase */}
                <Grid size={{ xs: 12, md: 5.5 }}>
                  <TextField
                    label="Add Language"
                    value={addLanguages}
                    onChange={(e) =>
                      setAddLanguages(e.target.value.toUpperCase())
                    }
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 0.2 }}></Grid>

                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={postLanguages}
                  >
                    Save
                  </Button>
                </Grid>
              </Grid>
            </>
          </Grid>
        )}

        {/* Document type multi-select — filters out already uploaded types in edit mode */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Autocomplete
            multiple
            options={availableDocumentTypes}
            value={employeeDocuments}
            onChange={(e, newValue) => {
              setEmployeeDocuments(newValue);
              setUploadEmployeeDocs((prev) => {
                return newValue.map((doc) => {
                  const existing = prev.find((p) => p.docId === doc.DOC_ID);
                  return (
                    existing ?? {
                      docId: doc.DOC_ID,
                      docName: doc.DOC_NAME,
                      file: null,
                    }
                  );
                });
              });
            }}
            getOptionLabel={(option) => option?.DOC_NAME || ""}
            isOptionEqualToValue={(opt, val) => opt?.DOC_ID === val?.DOC_ID}
            renderInput={(params) => (
              <TextField {...params} label="Select Document Type" />
            )}
          />
        </Grid>

        {/* File upload button — assigns the file to the next pending document slot */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Button
            component="label"
            variant="outlined"
            sx={{ fontWeight: "bold", width: "80%" }}
            startIcon={<CloudUploadIcon />}
          >
            Upload Document
            <VisuallyHiddenInput type="file" onChange={handleTopUpload} />
          </Button>
        </Grid>

        {/* ===== LANGUAGE TABLE ===== */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
              mt: 2,
            }}
          >
            <TableContainer sx={{ maxHeight: "150px", overflow: "auto" }}>
              <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#2c2c3d" : "#dedede",
                      "& th": { fontWeight: 600 },
                      fontSize: "12px",
                      alignItems: "left",
                    }}
                  >
                    <TableCell>Edit</TableCell>
                    <TableCell>Language</TableCell>
                    <TableCell align="right">Speak</TableCell>
                    <TableCell align="right">Read</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {langTableData.length === 0 ? (
                    <TableRow key="empty-row">
                      <TableCell
                        colSpan={4}
                        align="center"
                        variant="caption"
                        sx={{ fontWeight: 500, color: "grey" }}
                      >
                        No languages added
                      </TableCell>
                    </TableRow>
                  ) : (
                    langTableData.map((row, index) => (
                      <TableRow key={`lang-${row.lang_id}`}>
                        {/* Edit icon — loads the language back into the selector for modification */}
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedLanguages({
                                lang_id: row.lang_id,
                                lang_name: row.lang_name,
                              });

                              setLangPermission({
                                speak: row.speak,
                                read: row.read,
                              });

                              // Remove from table so it can be re-added after editing
                              setLangTableData((prev) =>
                                prev.filter((l) => l.lang_id !== row.lang_id),
                              );
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>

                        <TableCell>{row.lang_name}</TableCell>

                        {/* Checkmark or cross based on speak/read permission */}
                        <TableCell align="center">
                          {row.speak ? "✓" : "✗"}
                        </TableCell>

                        <TableCell align="center">
                          {row.read ? "✓" : "✗"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* ===== DOCUMENT TABLE ===== */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
              mt: 2,
            }}
          >
            <TableContainer sx={{ maxHeight: "150px", overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#2c2c3d" : "#dedede",
                      "& th": { fontWeight: 600 },
                    }}
                  >
                    <TableCell>Doc Type</TableCell>
                    <TableCell width="30%" align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {/* Empty state — shown when no documents are uploaded or pending */}
                  {uploadedEmployeeDocs.length === 0 &&
                    uploadEmployeeDocs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            No documents uploaded
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                  {/* Already uploaded documents fetched from the database */}
                  {uploadedEmployeeDocs.map((doc) => (
                    <TableRow key={doc.EMP_DOC_LINK_ID}>
                      <TableCell align="left">{doc.DOC_NAME}</TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {/* Preview button — fetches blob from server */}
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePreviewDocument(doc)}
                        >
                          <VisibilityIcon />
                        </IconButton>

                        {/* Delete button — removes the document from the server and state */}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            DeleteSingleUploadedDoc(
                              editRowData?.[0]?.EMP_ID,
                              doc.EMP_DOC_LINK_ID,
                            )
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Locally staged documents — selected but not yet saved to the server */}
                  {uploadEmployeeDocs.map((row) => (
                    <TableRow key={row.docId}>
                      <TableCell align="left">{row.docName}</TableCell>

                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                        {/* Preview button — creates a local object URL for the staged file */}
                        {row.file && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              setPreviewDoc({
                                DOC_NAME: row.docName,
                                FILE_NAME: row.file.name,
                                file: row.file,
                                isLocal: true,
                              })
                            }
                          >
                            <VisibilityIcon />
                          </IconButton>
                        )}

                        {/* Remove button — removes the staged file from the pending upload list */}
                        {row.file && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setUploadEmployeeDocs((prev) =>
                                prev.filter((d) => d.docId !== row.docId),
                              )
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                {/* Document preview dialog — handles both local files and server blobs */}
                <Dialog
                  open={Boolean(previewDoc)}
                  onClose={() => {
                    setPreviewDoc(null);
                    setPreviewUrl(null);
                  }}
                  maxWidth="sm"
                  slotProps={{ backdrop: { invisible: true } }}
                  fullWidth
                  sx={{ textAlign: "center" }}
                >
                  <DialogTitle
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    Document Preview
                    <IconButton
                      onClick={() => {
                        setPreviewDoc(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>

                  <DialogContent>
                    {previewDoc && (
                      <>
                        <Typography fontWeight={600}>
                          {previewDoc.DOC_NAME}
                        </Typography>

                        {/* Local file preview — renders directly from the File object */}
                        {previewDoc.isLocal ? (
                          <>
                            {previewDoc.file.type === "application/pdf" ? (
                              <iframe
                                src={URL.createObjectURL(previewDoc.file)}
                                width="100%"
                                height="500px"
                                style={{ border: "none", borderRadius: 6 }}
                              />
                            ) : (
                              <img
                                src={URL.createObjectURL(previewDoc.file)}
                                alt="preview"
                                style={{ width: "100%", borderRadius: 6 }}
                              />
                            )}
                          </>
                        ) : (
                          <>
                            {/* Server file preview — renders from a fetched blob URL */}
                            {previewUrl &&
                              (previewDoc.FILE_NAME.toLowerCase().includes(
                                ".pdf",
                              ) ? (
                                <iframe
                                  src={previewUrl}
                                  width="100%"
                                  height="500px"
                                  style={{ border: "none", borderRadius: 6 }}
                                />
                              ) : (
                                <img
                                  src={previewUrl}
                                  alt="preview"
                                  style={{ width: "100%", borderRadius: 6 }}
                                />
                              ))}
                          </>
                        )}
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* ===== ACTION BUTTONS ===== */}
      <Box mt={2} textAlign="right">
        {/* Show Update in edit mode, Save in add mode */}
        {isEditMode ? (
          <Button
            variant="contained"
            size="small"
            color="primary"
            sx={{ mr: 1 }}
            onClick={updateForm}
          >
            Update
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
            onClick={submitForm}
          >
            Save
          </Button>
        )}

        {/* Clear button — resets all fields and exits edit mode */}
        <Button
          variant="contained"
          size="small"
          color="warning"
          onClick={ClearAllForm}
        >
          Clear
        </Button>
      </Box>
    </>
  );
}
