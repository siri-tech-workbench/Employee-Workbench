import { IconButton, Tooltip, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/ModeEditOutlineRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid } from "@mui/x-data-grid";
import { deletemenuitem } from "../../../../Services/menuitems.services";
import {
  deleteErrorAlert,
  deleteAlert,
  showPostSuccess,
} from "../../../../Components/swal_alert";

/**
 * AddMainmenuItemGrid
 * Displays the list of menu items in a data grid
 * with inline edit and delete actions per row.
 *
 * Props:
 *   rows              - Array of menu item records to display.
 *   onEdit            - Callback invoked with the row data when edit is clicked.
 *   loading           - Boolean flag to show the grid loading skeleton.
 *   fetchAllData      - Callback to reload grid data after a delete.
 *   rowHeight         - Height of each data row in pixels. Default: 38.
 *   columnHeaderHeight - Height of the column header row in pixels. Default: 40.
 */
export default function AddMainmenuItemGrid({
  rows = [],
  onEdit,
  loading,
  fetchAllData,
  rowHeight = 38,
  columnHeaderHeight = 40,
}) {
  /**
   * Prompts the user for confirmation, then deletes the selected menu item.
   * Refreshes the grid and shows a success message on successful deletion.
   */
  const handleDelete = async (id) => {
    if (!id) return;

    try {
      const result = await deleteAlert(
        "Are you sure?",
        "Delete this menu item?",
      );

      if (!result.isConfirmed) return;

      const res = await deletemenuitem(id);

      if (res?.Status === 1) {
        showPostSuccess("Deleted successfully");
        fetchAllData?.();
      } else {
        deleteErrorAlert("Failed to delete");
      }
    } catch (error) {
      console.error(error);
      deleteErrorAlert("Failed to delete");
    }
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      renderCell: (params) => (
        // Action icons for edit and delete per row
        <Box
          sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}
        >
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              sx={{ p: 0.3 }}
              // Note: "menue_item_id" is a typo in the API response — kept to match backend field name
              onClick={() => handleDelete(params.row.menue_item_id)}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    // Note: "menue_item_name" is a typo in the API response — kept to match backend field name
    { field: "menue_item_name", headerName: "Item Name", width: 200 },
    { field: "icon", headerName: "Icon", width: 200 },
    {
      field: "page_name_navigation",
      headerName: "Page",
      width: 200,
      // Render empty string instead of "null" text for cleaner display
      renderCell: (params) => params.value ?? "",
    },
    { field: "module_name", headerName: "Module", width: 150 },
    { field: "main_menu_name", headerName: "Main Menu", width: 150 },
    { field: "position", headerName: "Pos", width: 70 },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.menue_item_id}
        rowHeight={rowHeight}
        columnHeaderHeight={columnHeaderHeight}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        autoHeight
      />
    </Box>
  );
}
