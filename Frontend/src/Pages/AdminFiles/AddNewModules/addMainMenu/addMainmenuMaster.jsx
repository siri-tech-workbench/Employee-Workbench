import { useCallback, useState, useEffect } from "react";
import AddMainmenuForm from "./addMainmenuForm";
import AddMainmenuGrid from "./addMainMenuGrid";
import { Grid } from "@mui/material";
import { fetchMainMenu } from "../../../../Services/addMainMenu.services";
import CircularBubbleLoading from "../../../../Components/loading";

/**
 * AddMainmenuMaster
 * Parent/master component for the Main Menu module.
 * Manages shared state between the form and the grid,
 * including edit mode, row data, and loading state.
 */
const AddMainmenuMaster = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  /**
   * Fetches the latest main menu list from the API
   * and updates the grid rows.
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchMainMenu();      
      setRows(response.items);
    } catch (error) {
      console.error("Error fetching main menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load main menu data on initial mount
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Sets the selected row into edit mode when
   * the edit icon is clicked in the grid.
   */
  const handleEditFromGrid = useCallback((row) => {
    setEditingItem(row);
  }, []);

  /**
   * Clears edit mode and refreshes the grid
   * after a form save, update, or clear action.
   */
  const handleEditComplete = useCallback(() => {
    setEditingItem(null);
    fetchData();
  }, []);

  /**
   * Triggers a grid data refresh.
   * Called by the form after a successful save or update.
   */
  const handleGridRefresh = useCallback(() => {
    fetchData();
  }, []);

  return (
    <>
      {/* Full-screen loader shown during API fetch */}
      {loading && <CircularBubbleLoading />}

      <Grid container spacing={3}>
        {/* Form section — switches between Add and Edit mode */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <AddMainmenuForm
            editingItem={editingItem}
            onEditComplete={handleEditComplete}
            onRequestRefresh={handleGridRefresh}
          />
        </Grid>

        {/* Grid section — displays all main menu records */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <AddMainmenuGrid
            rows={rows}
            onEdit={handleEditFromGrid}
            onRefresh={handleGridRefresh}
            loading={loading}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default AddMainmenuMaster;
