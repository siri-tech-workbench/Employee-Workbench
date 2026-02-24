import {
  Grid,
  TextField,
  Paper,
  Button,
  Box,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { z } from "zod";
import { useState, useEffect } from "react";
import { getemployeedd } from "../../../Services/usermast.services";
import {
  getcustomerdd,
  getmoduledd,
  postproject,
  updateproject,
} from "../../../Services/project.service";
import { showPostError } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";
import { showAlert } from "../../../Components/swal_alert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

/* Define validation schema for the project form using Zod */
const projectSchema = z
  .object({
    customer: z
      .number()
      .nullable()
      .refine((v) => v !== null, { message: "Customer is required" }),

    projectName: z.string().min(3, "Project Name is required"),

    module: z
      .number()
      .nullable()
      .refine((v) => v !== null, { message: "Module is required" }),

    projectLeader: z
      .number()
      .nullable()
      .refine((v) => v !== null, { message: "Project Leader is required" }),

    poNumber: z.string().min(1, "PO Number is required"),

    poDate: z
      .date()
      .nullable()
      .refine((v) => v !== null, { message: "PO Date is required" }),

    startDate: z
      .date()
      .nullable()
      .refine((v) => v !== null, { message: "Start Date is required" }),

    endDate: z
      .date()
      .nullable()
      .refine((v) => v !== null, { message: "End Date is required" }),
  })
  /* Custom validation to ensure project timeline logic is correct */
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return data.endDate >= data.startDate;
    },
    {
      message: "End Date must be after Start Date",
      path: ["endDate"],
    },
  );

/* Helper function to validate individual fields on change */
const validateField = (schema, field, value) => {
  if (!schema.shape[field]) return "";

  const result = schema.pick({ [field]: true }).safeParse({
    [field]: value,
  });

  return result.success ? "" : result.error.issues[0].message;
};

/* Styled component for hidden file input to maintain accessibility while using custom UI */
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

/* Shared styles for DatePicker components across the form */
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

export default function ProjectsForm({ editUser, clearEdit, onSuccess }) {
  /* State management for loading status and dropdown lists */
  const [loading, setLoading] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const [moduleList, setModuleList] = useState([]);
  const [customerList, setCustomerList] = useState([]);

  /* State management for file uploads and previews */
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [existingFiles, setExistingFiles] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /* Form state initialization */
  const [formData, setFormData] = useState({
    customer: null,
    projectName: "",
    module: null,
    projectLeader: null,
    poNumber: "",
    poDate: null,
    startDate: null,
    endDate: null,
  });

  /* Validation errors state */
  const [errors, setErrors] = useState({});

  /* Handle input changes and perform real-time validation */
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const errorMessage = validateField(projectSchema, field, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: errorMessage,
      }));

      return updated;
    });
  };

  /* Populate form when editUser prop changes (Edit Mode) */
  useEffect(() => {
    if (!editUser) {
      setExistingFiles([]);
      return;
    }

    setFormData({
      customer: editUser.customer_id ?? null,
      projectName: editUser.project_name ?? "",
      module: editUser.module_id ?? null,
      projectLeader: editUser.project_leader ?? null,
      poNumber: editUser.ponumber ?? "",
      poDate: editUser.po_date ? new Date(editUser.po_date) : null,
      startDate: editUser.start_date ? new Date(editUser.start_date) : null,
      endDate: editUser.end_date ? new Date(editUser.end_date) : null,
      documents: [],
    });

    setExistingFiles(Array.isArray(editUser.files) ? editUser.files : []);
    setErrors({});
  }, [editUser]);

  /* Fetch initial dropdown data on component mount */
  useEffect(() => {
    fetchEmployees();
    fetchCustomer();
    fetchModule();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getemployeedd();
      setEmployeeList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  const fetchCustomer = async () => {
    try {
      const res = await getcustomerdd();
      setCustomerList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch customer", error);
    }
  };

  const fetchModule = async () => {
    try {
      const res = await getmoduledd();
      setModuleList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch module", error);
    }
  };

  /* Main form submission handler for both Create and Update */
  const handleSubmit = async () => {
    const result = projectSchema.safeParse(formData);

    /* Stop submission if schema validation fails */
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      /* Prepare FormData for multipart/form-data request (required for files) */
      const formDataObj = new FormData();
      formDataObj.append("project_name", formData.projectName);
      formDataObj.append("ponumber", formData.poNumber || "");
      formDataObj.append("customer_id", formData.customer);
      formDataObj.append("module_id", formData.module);
      formDataObj.append("project_leader", formData.projectLeader);
      formDataObj.append("start_date", formData.startDate.toISOString());

      if (formData.endDate) {
        formDataObj.append("end_date", formData.endDate.toISOString());
      }

      if (formData.poDate) {
        formDataObj.append("po_date", formData.poDate.toISOString());
      }

      /* Append new files to form data */
      files.forEach((file) => {
        formDataObj.append("files", file);
      });

      let response;
      if (editUser) {
        /* Execute Update logic */
        response = await updateproject(editUser.project_id, formDataObj);
        if (response?.Status === 1 || response?.statusCode === 200) {
          await showAlert("success", "Project updated successfully");
          clearEdit();
        } else {
          showPostError(response?.message || "Project update failed");
          return;
        }
      } else {
        /* Execute Creation logic */
        response = await postproject(formDataObj);
        if (response?.Status === 1 || response?.statusCode === 200) {
          await showAlert("success", "Project created successfully");
        } else {
          showPostError(response?.message || "Project creation failed");
          return;
        }
      }

      /* Post-submission cleanup */
      onSuccess();
      setFiles([]);
      setFileInputKey(Date.now());
      handleClear();
    } catch (err) {
      console.error("Project save failed", err);
      await showAlert(
        "error",
        err.response?.data?.message || "Something went wrong!",
      );
    } finally {
      setLoading(false);
    }
  };

  /* Logic to open previously uploaded files from server */
  const openExistingFile = (file) => {
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    window.open(`${baseUrl}/project/file/${file}`, "_blank");
  };

  /* Reset form state to initial values */
  const handleClear = () => {
    setFormData({
      customer: null,
      projectName: "",
      module: null,
      projectLeader: null,
      poNumber: "",
      poDate: null,
      startDate: null,
      endDate: null,
      documents: [],
    });

    setErrors({});
    clearEdit();
  };

  return (
    <div>
      {loading && <Loading />}
      <Grid container spacing={2}>
        {/* Main form fields section */}
        <Grid size={{ xs: 12, md: 7 }} component={Paper} p={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={customerList}
                getOptionLabel={(option) => option.customer_name || ""}
                isOptionEqualToValue={(opt, val) =>
                  opt.customer_id === val.customer_id
                }
                value={
                  customerList.find(
                    (e) => e.customer_id === formData.customer,
                  ) || null
                }
                onChange={(e, value) =>
                  handleChange("customer", value ? value.customer_id : null)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label=" Customer"
                    error={!!errors.customer}
                    helperText={errors.customer}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Project Name"
                value={formData.projectName}
                onChange={(e) => handleChange("projectName", e.target.value)}
                error={!!errors.projectName}
                helperText={errors.projectName}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={moduleList}
                getOptionLabel={(option) => option.module_name || ""}
                isOptionEqualToValue={(opt, val) =>
                  opt.module_id === val.module_id
                }
                value={
                  moduleList.find((e) => e.module_id === formData.module) ||
                  null
                }
                onChange={(e, value) =>
                  handleChange("module", value ? value.module_id : null)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label=" Module"
                    error={!!errors.module}
                    helperText={errors.module}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={employeeList}
                getOptionLabel={(option) => option.emp_name || ""}
                isOptionEqualToValue={(opt, val) => opt.emp_id === val.emp_id}
                value={
                  employeeList.find(
                    (e) => e.emp_id === formData.projectLeader,
                  ) || null
                }
                onChange={(e, value) =>
                  handleChange("projectLeader", value ? value.emp_id : null)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label=" Project Leader"
                    error={!!errors.projectLeader}
                    helperText={errors.projectLeader}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="PO Number"
                value={formData.poNumber}
                onChange={(e) => handleChange("poNumber", e.target.value)}
                error={!!errors.poNumber}
                helperText={errors.poNumber}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="PO Date"
                  format="dd-MM-yyyy"
                  value={formData.poDate}
                  onChange={(v) => handleChange("poDate", v)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!errors.poDate,
                      helperText: errors.poDate,
                      sx: (theme) => datePickerStyle(theme),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  format="dd-MM-yyyy"
                  value={formData.startDate}
                  onChange={(v) => handleChange("startDate", v)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate,
                      sx: (theme) => datePickerStyle(theme),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  format="dd-MM-yyyy"
                  value={formData.endDate}
                  onChange={(v) => handleChange("endDate", v)}
                  disabled={!formData.startDate}
                  minDate={formData.startDate}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate,
                      sx: (theme) => datePickerStyle(theme),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }} textAlign={"right"}>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                onClick={handleSubmit}
                sx={{ mr: 1 }}
              >
                {editUser ? "Update" : "Save"}
              </Button>
              <Button
                variant="contained"
                size="small"
                color="warning"
                onClick={handleClear}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* File management and list section */}
        <Grid size={{ xs: 12, md: 5 }} component={Paper} p={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                Upload files
                <VisuallyHiddenInput
                  key={fileInputKey}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    /* Filter files by type and size (limit 1MB) */
                    const selected = Array.from(e.target.files).filter(
                      (f) =>
                        ["image/jpeg", "image/png", "application/pdf"].includes(
                          f.type,
                        ) && f.size < 1024 * 1024,
                    );

                    setFiles((prev) => [...prev, ...selected]);
                  }}
                />
                {errors.documents && (
                  <Box color="error.main" fontSize={12}>
                    {errors.documents}
                  </Box>
                )}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Paper
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
                  mt: 1,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark" ? "#2c2c3d" : "#dedede",
                        "& th": {
                          fontWeight: 600,
                        },
                      }}
                    >
                      <TableCell>Document Name</TableCell>
                      <TableCell align="center"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingFiles.length === 0 && files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No files
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {/* Render existing documents from the database */}
                        {existingFiles.map((file, index) => (
                          <TableRow key={`old-${index}`}>
                            <TableCell>{file}</TableCell>
                            <TableCell align="center">
                              <VisibilityIcon
                                sx={{ cursor: "pointer", mr: 1 }}
                                onClick={() => openExistingFile(file)}
                              />
                              <DeleteIcon
                                color="error"
                                sx={{ cursor: "pointer" }}
                                onClick={() =>
                                  setExistingFiles((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Render newly selected files for upload */}
                        {files.map((file, index) => (
                          <TableRow key={`new-${index}`}>
                            <TableCell>{file.name}</TableCell>
                            <TableCell align="center">
                              <VisibilityIcon
                                sx={{ cursor: "pointer", mr: 1 }}
                                onClick={() => {
                                  setPreviewFile(file);
                                  setOpenPreview(true);
                                }}
                              />
                              <DeleteIcon
                                color="error"
                                sx={{ cursor: "pointer" }}
                                onClick={() =>
                                  setFiles((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Dialog for previewing PDF or Image files before/after upload */}
      <Dialog
        open={openPreview}
        onClose={() => {
          setOpenPreview(false);
          setPreviewFile(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Preview
          <IconButton
            onClick={() => {
              setOpenPreview(false);
              setPreviewFile(null);
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewFile instanceof File ? (
            previewFile.type === "application/pdf" ? (
              <iframe
                src={URL.createObjectURL(previewFile)}
                width="100%"
                height="500px"
                style={{ border: "none" }}
              />
            ) : (
              <img
                src={URL.createObjectURL(previewFile)}
                alt="preview"
                style={{ width: "100%" }}
              />
            )
          ) : (
            <Box textAlign="center">No preview available</Box>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
