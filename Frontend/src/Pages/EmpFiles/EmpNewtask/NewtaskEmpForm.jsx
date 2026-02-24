import {
  Grid,
  TextField,
  Paper,
  Button,
  Typography,
  Autocomplete,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
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

// DatePicker field styles: keeps label and section text visible in dark/light mode
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

export default function NewtaskEmpForm() {
  return (
    <>
      <Grid container spacing={1} mt={1}>
        {/* Left panel: task creation fields */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Grid container spacing={2} component={Paper} p={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" fontWeight={700} color="#6F60C1">
                Create New Task
              </Typography>
            </Grid>

            {/* Project selector */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={["Project 1", "Project 2", "Project 3", "Project 4"]}
                renderInput={(params) => (
                  <TextField {...params} label="Project" size="small" />
                )}
              />
            </Grid>

            {/* Task category selector */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={[
                  "Category 1",
                  "Category 2",
                  "Category 3",
                  "Category 4",
                ]}
                renderInput={(params) => (
                  <TextField {...params} label="Task Category" size="small" />
                )}
              />
            </Grid>

            {/* Task description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Task Description"
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </Grid>

            {/* Priority */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={["Low", "Medium", "High"]}
                renderInput={(params) => (
                  <TextField {...params} label="Priority" size="small" />
                )}
              />
            </Grid>

            {/* Assignee */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={["Team 1", "Team 2", "Team 3", "Team 4"]}
                renderInput={(params) => (
                  <TextField {...params} label="Assigned To" size="small" />
                )}
              />
            </Grid>

            {/* Due date */}
            <Grid size={{ xs: 12, md: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: (theme) => datePickerStyle(theme),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Estimated duration */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Estimate Duration" size="small" fullWidth />
            </Grid>

            {/* Verifier */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={["Team 1", "Team 2", "Team 3", "Team 4"]}
                renderInput={(params) => (
                  <TextField {...params} label="Verified By" size="small" />
                )}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right panel: document attachments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Grid container spacing={2} component={Paper} p={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" fontWeight={700} color="#6F60C1">
                Documents
              </Typography>
            </Grid>

            {/* Document type selector */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={["pdf", "doc", "docx", "png", "jpg", "jpeg"]}
                renderInput={(params) => (
                  <TextField {...params} label="Document Type" size="small" />
                )}
              />
            </Grid>

            {/* File picker trigger */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                component="label"
                fullWidth
                sx={{ height: 32 }}
                variant="contained"
                startIcon={<CloudUploadIcon />}
              >
                Attach files
                <VisuallyHiddenInput type="file" multiple />
              </Button>
            </Grid>

            {/* Add document row */}
            <Grid size={{ xs: 12, md: 4 }} textAlign="end">
              <Button variant="contained" size="small">
                ADD
              </Button>
            </Grid>

            {/* Attached files table */}
            <Grid size={{ xs: 12 }}>
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
                        "& th": { fontWeight: 600 },
                      }}
                    >
                      <TableCell>File Name</TableCell>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell>Uploaded On</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <a
                          href="https://cdn.pixabay.com/photo/2025/11/08/13/23/zebra-9944593_1280.jpg"
                          target="_blank"
                          rel="noreferrer"
                        >
                          PO-details.pdf
                        </a>
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <a href="#" target="_blank" rel="noreferrer">
                          ProjectOrder.pdf
                        </a>
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Attachment count + save/clear actions */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="body2" sx={{ mt: 1 }} color="#6F60C1">
                4 files Attached
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} textAlign="end">
              <Button
                variant="contained"
                size="small"
                color="secondary"
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button variant="contained" size="small" color="warning">
                Clear
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
