import { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Autocomplete,
} from "@mui/material";
import CircularBubbleLoading from "../../../../Components/loading";
import { z } from "zod";
import Validation from "../../../../Components/validation";
import {
  fetchmodule,
  fetchmenus,
  createmenuitem,
  updatemenuitem,
} from "../../../../Services/menuitems.services";
import { showAlert } from "../../../../Components/swal_alert";

/**
 * Validation schema for the menu item form.
 * Defined outside the component to avoid recreation on every render.
 */
const schema = z.object({
  menuitem_name: z.string().min(1, "Please enter Menu Item Name"),
  icon: z.string().min(1, "Please enter Icon Name"),
  page_name_navigation: z.string().min(1, "Please enter Page Navigation"),
  module_menu_id: z.preprocess(
    (v) => Number(v),
    z.number().min(1, "Please select Module"),
  ),
  main_menu_id: z.preprocess(
    (v) => Number(v),
    z.number().min(1, "Please select Main Menu"),
  ),
  position: z.preprocess(
    (v) => Number(v),
    z.number().min(1, "Please enter Position"),
  ),
});

/**
 * Normalizes various API response shapes into a flat array.
 * Handles cases where items may be nested under data, data.data, or items.
 */
const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

/**
 * AddMainmenuItemForm
 * Renders a form to add or edit a menu item entry.
 * Loads module and main menu dropdowns dynamically.
 *
 * Props:
 *   fetchAllData - Callback to reload the grid after save or update.
 *   editItem     - The item object to edit. If null, form is in add mode.
 *   clearEdit    - Callback to clear the edit state in the parent.
 */
export default function AddMainmenuItemForm({
  fetchAllData,
  editItem,
  clearEdit,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [mainMenuOptions, setMainMenuOptions] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    menuitem_name: "",
    icon: "",
    page_name_navigation: "",
    module_menu_id: "",
    main_menu_id: "",
    position: "",
  });

  const isEditMode = Boolean(editItem?.menue_item_id);

  /**
   * Updates a single form field and clears its error message.
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /**
   * Validates all form fields against the schema.
   * Returns true if all fields pass, false otherwise.
   */
  const validateForm = () => {
    const { isValid, errors } = Validation(formData, schema);
    setErrors(errors);
    return isValid;
  };

  /**
   * Builds the API request payload from current form state.
   * Keys are uppercase to match the backend field naming convention.
   */
  const buildPayload = () => ({
    MENUE_ITEM_NAME: formData.menuitem_name,
    ICON: formData.icon,
    PAGE_NAME_NAVIGATION: formData.page_name_navigation,
    MODULE_MENU_ID: Number(formData.module_menu_id),
    MAIN_MENUE_ID: Number(formData.main_menu_id),
    POSITION: Number(formData.position),
  });

  /**
   * Resets all form fields, errors, and the main menu dropdown
   * without triggering the parent clearEdit callback.
   * Used internally when switching from edit mode to empty state.
   */
  const resetForm = () => {
    setFormData({
      menuitem_name: "",
      icon: "",
      page_name_navigation: "",
      module_menu_id: "",
      main_menu_id: "",
      position: "",
    });
    setErrors({});
    setMainMenuOptions([]);
  };

  /**
   * Resets the form and notifies the parent to clear the edit state.
   * Called by the Clear button and after successful save or update.
   */
  const handleClear = () => {
    resetForm();
    clearEdit?.();
  };

  /**
   * Fetches the module dropdown options on component mount.
   */
  const loadModuleOptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchmodule();

      setModuleOptions(normalizeList(res?.data ?? res));
    } catch (err) {
      console.error("Error fetching module dropdown:", err);
      // Module fetch failed — dropdown will remain empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches main menu options filtered by the selected module.
   * Clears main menu options if no module is selected.
   */
  const loadMainMenuOptions = useCallback(async (moduleId) => {
    if (!moduleId) {
      setMainMenuOptions([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetchmenus(moduleId);
      setMainMenuOptions(normalizeList(res?.items ?? res));
    } catch (err) {
      console.error(err);
      // Main menu fetch failed — dropdown will remain empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load module dropdown on mount
  useEffect(() => {
    loadModuleOptions();
  }, [loadModuleOptions]);

  // Reload main menu dropdown when selected module changes
  useEffect(() => {
    loadMainMenuOptions(formData.module_menu_id);
  }, [formData.module_menu_id, loadMainMenuOptions]);

  // Populate form fields when an item is selected for editing
  useEffect(() => {
    if (!editItem) {
      resetForm();
      return;
    }

    setFormData({
      menuitem_name: editItem.menue_item_name ?? "",
      icon: editItem.icon ?? "",
      page_name_navigation: editItem.page_name_navigation ?? "",
      module_menu_id: editItem.module_menu_id ?? "",
      main_menu_id: editItem.main_menue_id ?? "",
      position: editItem.position ?? "",
    });
  }, [editItem]);

  /**
   * Validates and submits the form to create a new menu item.
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await createmenuitem(buildPayload());

      if (response?.Status === 1) {
        showAlert("success", "Item saved successfully");
        fetchAllData?.();
        handleClear();
      } else {
        showAlert("warning", response?.Message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Failed to save item");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validates and submits the form to update an existing menu item.
   */
  const handleUpdate = async () => {
    if (!validateForm()) return;
    if (!editItem?.menue_item_id) {
      return showAlert("warning", "No item selected");
    }

    try {

      const payload = {
        MENUE_ITEM_ID: editItem.menue_item_id,
        MENUE_ITEM_NAME: formData.menuitem_name,
        ICON: formData.icon,
        PAGE_NAME_NAVIGATION: formData.page_name_navigation,
        MODULE_MENU_ID: Number(formData.module_menu_id),
        MAIN_MENUE_ID: Number(formData.main_menu_id),
        POSITION: Number(formData.position),
      };
      
      const response = await updatemenuitem(editItem.menue_item_id, payload);

      if (response?.Status === 1) {
        await showAlert("success", "Updated successfully");
        fetchAllData?.();
        handleClear();
        clearEdit?.();
      } else {
        showAlert("warning", response?.Message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Failed to update item");
    } finally {
    }
  };

  return (
    <>
      {/* Full-screen loader shown during API calls */}
      {isLoading && <CircularBubbleLoading />}

      <Grid container spacing={2}>
        {/* Form title changes based on add or edit mode */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Typography variant="h6">
            {isEditMode ? "Edit Menu Item" : "Add Menu Item"}
          </Typography>
        </Grid>

        {/* Menu item name input */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            size="small"
            fullWidth
            label="Menu Item Name"
            value={formData.menuitem_name}
            onChange={(e) => handleFieldChange("menuitem_name", e.target.value)}
            error={!!errors.menuitem_name}
            helperText={errors.menuitem_name}
          />
        </Grid>

        {/* Icon name input */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            size="small"
            fullWidth
            label="Icon"
            value={formData.icon}
            onChange={(e) => handleFieldChange("icon", e.target.value)}
            error={!!errors.icon}
            helperText={errors.icon}
          />
        </Grid>

        {/* Page navigation route name input */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            size="small"
            fullWidth
            label="Page Name Navigation"
            value={formData.page_name_navigation}
            onChange={(e) =>
              handleFieldChange("page_name_navigation", e.target.value)
            }
            error={!!errors.page_name_navigation}
            helperText={errors.page_name_navigation}
          />
        </Grid>

        {/* Module selection dropdown */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <Autocomplete
            size="small"
            fullWidth
            options={moduleOptions}
            getOptionLabel={(o) => o.module_name || ""}
            value={
              moduleOptions.find(
                (m) => m.module_menu_id === formData.module_menu_id,
              ) || null
            }
            onChange={(e, v) =>
              handleFieldChange("module_menu_id", v?.module_menu_id || "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Module"
                error={!!errors.module_menu_id}
                helperText={errors.module_menu_id}
              />
            )}
          />
        </Grid>

        {/* Main menu dropdown — disabled until a module is selected */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <Autocomplete
            size="small"
            fullWidth
            options={mainMenuOptions}
            getOptionLabel={(o) => o.main_menu_name || ""}
            value={
              mainMenuOptions.find(
                (m) => Number(m.main_menu_id) === Number(formData.main_menu_id),
              ) || null
            }
            onChange={(e, v) =>
              handleFieldChange("main_menu_id", v?.main_menu_id || "")
            }
            isOptionEqualToValue={(option, value) =>
              Number(option.main_menu_id) === Number(value.main_menu_id)
            }
            disabled={!formData.module_menu_id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Main Menu"
                error={!!errors.main_menu_id}
                helperText={errors.main_menu_id}
              />
            )}
          />
        </Grid>

        {/* Position order input (numeric) */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            size="small"
            fullWidth
            label="Position"
            value={formData.position}
            onChange={(e) => handleFieldChange("position", e.target.value)}
            error={!!errors.position}
            helperText={errors.position}
          />
        </Grid>

        {/* Save, Update, and Clear action buttons */}
        <Grid size={{ xs: 12, sm: 12, md: 1 }}>
          <Box sx={{ display: "inline-flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={isEditMode}
            >
              Save
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={handleUpdate}
              disabled={!isEditMode}
            >
              Update
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
    </>
  );
}
