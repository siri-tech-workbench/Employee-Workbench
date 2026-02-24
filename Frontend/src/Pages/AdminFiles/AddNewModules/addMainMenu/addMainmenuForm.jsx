import  { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Autocomplete,
} from "@mui/material";
import CircularBubbleLoading from "../../../../Components/loading";
import {
  fetchModuleDD,
  postMainMenu,
  updateMainMenu,
} from "../../../../Services/addMainMenu.services";
import { showSuccess, showError } from "../../../../Components/swal_alert";

/**
 * AddMainmenuForm
 * Renders a form to add or edit a main menu entry.
 *
 * Props:
 *   editingItem      - The item object to edit. If null, form is in add mode.
 *   onEditComplete   - Callback invoked after edit is completed or cleared.
 *   onRequestRefresh - Callback to refresh the parent list after save/update.
 */
export default function AddMainmenuForm({
  editingItem,
  onEditComplete,
  onRequestRefresh,
}) {
  const isEditMode = Boolean(editingItem);

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    main_menu_name: "",
    icon: "",
    module_menu_id: "",
    position: "",
    page_name_navigation: "",
  });

  const [errors, setErrors] = useState({
    main_menu_name: "",
    icon: "",
    module_menu_id: "",
    position: "",
    page_name_navigation: "",
  });

  const [moduleOptions, setModuleOptions] = useState([]);

  /**
   * Updates a single form field and clears its error message.
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /**
   * Validates all form fields.
   * Returns true if all fields pass, false otherwise.
   */
  const validateForm = () => {
    const temp = {};

    temp.main_menu_name = formData.main_menu_name
      ? ""
      : "Main Menu Name is required";
    temp.icon = formData.icon ? "" : "Icon is required";
    temp.module_menu_id = formData.module_menu_id ? "" : "Module is required";
    temp.page_name_navigation = formData.page_name_navigation
      ? ""
      : "Page Navigation is required";

    if (!formData.position) {
      temp.position = "Position is required";
    } else if (isNaN(formData.position)) {
      temp.position = "Position must be a number";
    } else {
      temp.position = "";
    }

    setErrors(temp);
    return Object.values(temp).every((x) => x === "");
  };

  /**
   * Fetches module dropdown options from the API
   * and populates the module autocomplete field.
   */
  const loadModuleOptions = async () => {
    try {
      const res = await fetchModuleDD();
      if (res?.items) {
        setModuleOptions(res.items);
      }
    } catch (error) {
      console.error("Error fetching module dropdown:", error);
    }
  };

  // Load module dropdown options on component mount
  useEffect(() => {
    loadModuleOptions();
  }, []);

  /**
   * Populates the form fields when an item is selected for editing.
   * Clears all errors when edit mode is activated.
   */
  useEffect(() => {
    if (editingItem) {
      setFormData({
        main_menu_name: editingItem.main_menu_name || "",
        icon: editingItem.icon || "",
        module_menu_id: editingItem.module_menu_id || "",
        page_name_navigation: editingItem.page_name_navigation || "",
        position: editingItem.position || "",
      });

      setErrors({
        main_menu_name: "",
        icon: "",
        module_menu_id: "",
        page_name_navigation: "",
        position: "",
      });
    }
  }, [editingItem]);

  /**
   * Resets the form to its default empty state
   * and notifies the parent that editing is complete.
   */
  const handleClear = (e) => {
    e.preventDefault();

    setFormData({
      main_menu_name: "",
      icon: "",
      module_menu_id: "",
      position: "",
      page_name_navigation: "",
    });

    setErrors({
      main_menu_name: "",
      icon: "",
      module_menu_id: "",
      position: "",
      page_name_navigation: "",
    });

    onEditComplete();
  };

  /**
   * Handles new main menu creation.
   * Validates the form, builds the payload, and calls the POST API.
   * Shows a specific error message if the position is already taken.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      main_menu_name: formData.main_menu_name,
      icon: formData.icon,
      module_menu_id: formData.module_menu_id,
      page_name_navigation: formData.page_name_navigation,
      position: formData.position,
    };

    try {
      setIsLoading(true);
      await postMainMenu(payload);
      showSuccess("Main Menu saved successfully");
      onRequestRefresh();
      handleClear(e);
    } catch (error) {
      // Handle duplicate position conflict separately
      if (
        error?.response?.data?.message === "Position already exists" ||
        error?.message?.includes("Position already exists")
      ) {
        showError("Position already exists. Please choose a different one.");
      } else {
        showError("Error saving main menu");
      }
      console.error("Error posting main menu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles updating an existing main menu entry.
   * Validates the form, builds the payload, and calls the PUT API.
   */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      main_menu_name: formData.main_menu_name,
      icon: formData.icon,
      module_menu_id: formData.module_menu_id,
      page_name_navigation: formData.page_name_navigation,
      position: formData.position,
    };

    try {
      setIsLoading(true);
      const res = await updateMainMenu(editingItem.main_menu_id, payload);

      if (res?.Status === 1) {
        showSuccess("Main Menu updated successfully");
        onRequestRefresh();
        handleClear(e);
      } else {
        showError("Error updating main menu");
      }
    } catch (error) {
      showError("Error updating main menu");
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Show full-screen loader during API calls */}
      {isLoading && <CircularBubbleLoading />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {/* Form title changes based on add or edit mode */}
              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                <Typography variant="h6">
                  {isEditMode ? "Edit Main Menu" : "Add Main Menu"}
                </Typography>
              </Grid>

              {/* Main Menu Name input */}
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Main Menu Name"
                  required
                  value={formData.main_menu_name}
                  onChange={(e) =>
                    handleFieldChange("main_menu_name", e.target.value)
                  }
                  error={Boolean(errors.main_menu_name)}
                  helperText={errors.main_menu_name}
                />
              </Grid>

              {/* Icon name input */}
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Icon"
                  required
                  value={formData.icon}
                  onChange={(e) => handleFieldChange("icon", e.target.value)}
                  error={Boolean(errors.icon)}
                  helperText={errors.icon}
                />
              </Grid>

              {/* Module selection dropdown */}
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={moduleOptions}
                  value={
                    moduleOptions.find(
                      (m) => m.module_menu_id === formData.module_menu_id,
                    ) || null
                  }
                  getOptionLabel={(opt) => opt?.module_name || ""}
                  isOptionEqualToValue={(o, v) =>
                    o.module_menu_id === v.module_menu_id
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.module_menu_id}>
                      {option.module_name}
                    </li>
                  )}
                  onChange={(e, value) =>
                    handleFieldChange(
                      "module_menu_id",
                      value?.module_menu_id || "",
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Module"
                      required
                      error={Boolean(errors.module_menu_id)}
                      helperText={errors.module_menu_id}
                    />
                  )}
                />
              </Grid>

              {/* Page navigation route name input */}
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Page Name Navigation"
                  value={formData.page_name_navigation}
                  onChange={(e) =>
                    handleFieldChange("page_name_navigation", e.target.value)
                  }
                  error={Boolean(errors.page_name_navigation)}
                  helperText={errors.page_name_navigation}
                />
              </Grid>

              {/* Position order input (numeric) */}
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Position"
                  required
                  value={formData.position}
                  onChange={(e) =>
                    handleFieldChange("position", e.target.value)
                  }
                  error={Boolean(errors.position)}
                  helperText={errors.position}
                />
              </Grid>

              {/* Save/Update and Clear action buttons */}
              <Grid
                size={{ xs: 12, sm: 12, md: 2 }}
                sx={{ textAlign: "right" }}
              >
                <Box sx={{ display: "inline-flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={isEditMode ? handleUpdate : handleSubmit}
                  >
                    {isEditMode ? "Update" : "Save"}
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
