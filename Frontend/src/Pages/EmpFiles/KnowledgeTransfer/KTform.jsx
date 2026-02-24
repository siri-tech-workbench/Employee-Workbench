import { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Paper,
  Button,
  Autocomplete,
  Typography,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { getKT_emp_DD, postKT } from "../../../Services/KT.services";
import {
  invalidDocFormatAlert,
  invalidDocSizeAlert,
  showPostSuccess,
  showPostError,
} from "../../../Components/swal_alert";
import CircularBubbleLoading from "../../../Components/loading";

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

// DatePicker field styles: label and border visibility in dark/light mode
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

// Only PDF attachments are accepted for KT documents
const ALLOWED_FILE_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Initial form values — reused by both useState and handleClear
const INITIAL_FORM = {
  date: null,
  presenter: null,
  topic: "",
  description: "",
};

// Initial error state — reused by both useState and validate
const INITIAL_ERRORS = {
  date: "",
  presenter: "",
  topic: "",
  file: "",
  description: "",
};

export default function KTform({ onRefresh }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [empDD, setEmpDD] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [files, setFiles] = useState([]);

  // Controls the file preview dialog
  const [openPreview, setOpenPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Derived values for the preview dialog
  const fileURL = previewFile ? URL.createObjectURL(previewFile) : null;
  const isPDF = previewFile?.type === "application/pdf";
  const isImage = previewFile?.type?.startsWith("image/");

  // Live word count shown below the description field
  const wordCount =
    form.description?.trim().split(/\s+/).filter(Boolean).length || 0;

  // Fetch employee dropdown options on mount
  useEffect(() => {
    const fetchEmpDD = async () => {
      try {
        const res = await getKT_emp_DD();
        setEmpDD(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        console.error("Failed to fetch employee dropdown:", err);
        setEmpDD([]);
      }
    };

    fetchEmpDD();
  }, []);

  /**
   * Validates the selected file for type and size before adding it to state.
   * Only one file is allowed at a time; replaces any previously attached file.
   */
  const handleFileUpload = (e) => {
    e.preventDefault();

    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    const file = selectedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      invalidDocSizeAlert();
      e.target.value = "";
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      invalidDocFormatAlert();
      e.target.value = "";
      return;
    }

    setFiles([file]);
    setErrors((prev) => ({ ...prev, file: "" }));
    e.target.value = "";
  };

  /**
   * Updates description field value while enforcing a 100-word maximum.
   * Sets an error without updating state when the limit is exceeded.
   */
  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length > 100) {
      setErrors((prev) => ({
        ...prev,
        description: "Maximum 100 words allowed",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, description: text }));
    setErrors((prev) => ({ ...prev, description: "" }));
  };

  /**
   * Validates all required fields before submission.
   * Returns true when all fields are valid; populates errors state otherwise.
   */
  const validate = () => {
    const tempErrors = { ...INITIAL_ERRORS };

    if (!form.date) tempErrors.date = "Date is required";
    if (!form.presenter) tempErrors.presenter = "Presenter is required";
    if (!form.topic.trim()) tempErrors.topic = "Topic is required";
    if (files.length === 0)
      tempErrors.file = "Presentation document is required";

    const descWords = form.description
      ?.trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (!form.description?.trim())
      tempErrors.description = "Description is required";
    else if (descWords > 100)
      tempErrors.description = "Maximum 100 words allowed";

    setErrors(tempErrors);
    return Object.values(tempErrors).every((e) => e === "");
  };

  // Builds FormData payload and posts the KT entry to the server
  const handleSave = async () => {
    if (!validate()) {
      await showPostError("Please fill all the required fields");
      return;
    }

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("K_DATE", dayjs(form.date).format("DD-MM-YY"));
      formData.append("K_TOPIC", form.topic);
      formData.append("K_DESCRIPTION", form.description);
      formData.append("EMP_ID", Number(form.presenter?.emp_id));
      if (files.length > 0) formData.append("K_FILE", files[0]);

      const res = await postKT(formData);

      if (res?.Status === 1 || res?.statusCode === 201) {
        await showPostSuccess("Knowledge saved successfully");
        onRefresh();
        handleClear();
      } else {
        await showPostError(res?.message || "Failed to save knowledge");
      }
    } catch (error) {
      console.error("KT save error:", error);
      await showPostError(
        error?.response?.data?.errors ||
          error?.response?.data?.message ||
          "Unexpected error occurred.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Resets all form fields, file list, and error messages
  const handleClear = () => {
    setForm(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setFiles([]);
  };

  return (
    <>
      {isSaving && <CircularBubbleLoading text="Saving" />}

      <Grid container spacing={2} component={Paper} p={2}>
        {/* KT date picker */}
        <Grid size={{ xs: 12, md: 12 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date *"
              format="DD-MMM-YYYY"
              value={form.date ? dayjs(form.date, "DD-MMM-YYYY") : null}
              onChange={(newValue) =>
                setForm((prev) => ({ ...prev, date: newValue }))
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: (theme) => datePickerStyle(theme),
                  error: Boolean(errors.date),
                  helperText: errors.date,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Presenter selector */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Autocomplete
            options={empDD}
            value={form.presenter}
            size="small"
            fullWidth
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, value) =>
              option?.emp_id === value?.emp_id
            }
            onChange={(_, value) =>
              setForm((prev) => ({ ...prev, presenter: value }))
            }
            renderOption={(props, option) => (
              <li {...props} key={option.emp_id}>
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Presenter"
                size="small"
                error={Boolean(errors.presenter)}
                helperText={errors.presenter}
              />
            )}
          />
        </Grid>

        {/* Topic input — displayed in uppercase */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            label="Topic *"
            size="small"
            fullWidth
            value={form.topic.toUpperCase()}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, topic: e.target.value }))
            }
            error={Boolean(errors.topic)}
            helperText={errors.topic}
          />
        </Grid>

        {/* Brief description with live word counter */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            label="Brief Description"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={handleDescriptionChange}
            error={Boolean(errors.description)}
            helperText={errors.description || `${wordCount}/100 words`}
          />
        </Grid>

        {/* File attachment: PDF only, max 10 MB */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
          >
            Attach Files
            <VisuallyHiddenInput
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
            />
          </Button>

          {errors.file && (
            <Typography color="error" variant="caption" display="block">
              {errors.file}
            </Typography>
          )}

          {/* Attached file list or empty state placeholder */}
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {files.length === 0 ? (
              <Paper
                elevation={1}
                sx={{ p: 1.5, borderLeft: "4px solid #6F60C1" }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  No file attached
                </Typography>
              </Paper>
            ) : (
              files.map((file, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderLeft: "4px solid #6F60C1",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#6F60C1",
                      fontWeight: 600,
                      width: "70%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={file.name} // shows full name on hover
                  >
                    {file.name}
                  </Typography>

                  <Stack direction="row" spacing={0.5}>
                    {/* Preview file in dialog */}
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setPreviewFile(file);
                        setOpenPreview(true);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>

                    {/* Remove file and re-validate */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setFiles((prev) => {
                          const updated = prev.filter((_, i) => i !== index);
                          if (updated.length === 0) {
                            setErrors((err) => ({
                              ...err,
                              file: "Presentation document is required",
                            }));
                          }
                          return updated;
                        });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>

          {/* File preview dialog */}
          <Dialog
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              File Preview
              <IconButton onClick={() => setOpenPreview(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent>
              {isImage && (
                <Box
                  component="img"
                  src={fileURL}
                  alt="Preview"
                  sx={{ width: "100%", borderRadius: 1 }}
                />
              )}

              {isPDF && (
                <iframe
                  src={fileURL}
                  width="100%"
                  height="500px"
                  style={{ border: "none" }}
                  title="PDF Preview"
                />
              )}

              {!isImage && !isPDF && (
                <Typography variant="body2">
                  Preview not available.{" "}
                  <a href={fileURL} download>
                    Download file
                  </a>
                </Typography>
              )}
            </DialogContent>
          </Dialog>
        </Grid>

        {/* Save and clear actions */}
        <Grid size={{ xs: 12, md: 12 }} textAlign="right">
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
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
    </>
  );
}
