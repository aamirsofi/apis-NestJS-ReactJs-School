import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface CategoryHeadsDialogsProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDelete: () => void;
  bulkDeleteDialogOpen?: boolean;
  setBulkDeleteDialogOpen?: (open: boolean) => void;
  handleBulkDelete?: () => void;
  selectedCount?: number;
  isLoading?: boolean;
}

export default function CategoryHeadsDialogs({
  deleteDialogOpen,
  setDeleteDialogOpen,
  handleDelete,
  bulkDeleteDialogOpen = false,
  setBulkDeleteDialogOpen,
  handleBulkDelete,
  selectedCount = 0,
  isLoading = false,
}: CategoryHeadsDialogsProps) {
  return (
    <>
      {/* Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category Head</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category head? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      {setBulkDeleteDialogOpen && handleBulkDelete && (
        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {selectedCount} Category Head{selectedCount !== 1 ? "s" : ""}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedCount} selected category head{selectedCount !== 1 ? "s" : ""}? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkDeleteDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : `Delete ${selectedCount}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

