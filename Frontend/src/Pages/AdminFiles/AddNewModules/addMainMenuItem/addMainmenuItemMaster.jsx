import { useState, useEffect } from "react";
import { Grid, Paper } from "@mui/material";
import AddMainmenuItemForm from "../addMainMenuItem/addMainmenuItemsForm";
import AddMainmenuItemGrid from "../addMainMenuItem/addMainmenuItemGrid";
import CircularBubbleLoading from "../../../../Components/loading";
import { getAllItems } from "../../../../Services/menuitems.services";

/**
 * AddMainmenuItemMaster
 * Parent/master component for the Menu Item module.
 * Manages shared state between the form and the grid,
 * including edit mode, row data, and loading state.
 */
export default function AddMainmenuItemMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);

  /**
   * Normalizes API response keys to lowercase
   * to ensure consistent field access across the grid and form.
   */
  const normalizeData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const clean = {};
      Object.keys(item).forEach((key) => {
        clean[key.toLowerCase()] = item[key];
      });
      return clean;
    });
  };

  /**
   * Fetches all menu items from the API
   * and updates the grid rows after normalizing the response.
   */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await getAllItems();
      setRows(normalizeData(res?.items || []));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      // API fetch failed — grid will retain previous rows
    } finally {
      setLoading(false);
    }
  };

  // Load all menu items on initial mount
  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <>
      {/* Full-screen loader shown during API fetch */}
      {loading && <CircularBubbleLoading />}

      <Grid container spacing={3}>
        {/* Form section — switches between Add and Edit mode */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper sx={{ p: 3 }}>
            <AddMainmenuItemForm
              fetchAllData={fetchAllData}
              editItem={editItem}
              clearEdit={() => setEditItem(null)}
            />
          </Paper>
        </Grid>

        {/* Grid section — displays all menu item records */}
        <Grid size={{ xs: 12, sm: 12, md: 11 }}>
          <Paper sx={{ p: 3 }}>
            <AddMainmenuItemGrid
              rows={rows}
              loading={loading}
              onEdit={setEditItem}
              fetchAllData={fetchAllData}
            />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
