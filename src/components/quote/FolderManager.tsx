import { useState } from "react";
import { Folder, FolderPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InquiryFolder {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

interface FolderManagerProps {
  folders: InquiryFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChange: () => void;
}

export function FolderManager({
  folders,
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
}: FolderManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<InquiryFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editFolderName, setEditFolderName] = useState("");
  const { toast } = useToast();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("inquiry_folders").insert({
      name: newFolderName.trim(),
      user_id: user.id,
    });

    if (error) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "文件夹已创建" });
      setNewFolderName("");
      setIsCreateOpen(false);
      onFoldersChange();
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;

    const { error } = await supabase
      .from("inquiry_folders")
      .update({ name: editFolderName.trim() })
      .eq("id", editingFolder.id);

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "文件夹已更新" });
      setIsEditOpen(false);
      setEditingFolder(null);
      onFoldersChange();
    }
  };

  const handleDeleteFolder = async (folder: InquiryFolder) => {
    const { error } = await supabase
      .from("inquiry_folders")
      .delete()
      .eq("id", folder.id);

    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "文件夹已删除" });
      if (selectedFolderId === folder.id) {
        onSelectFolder(null);
      }
      onFoldersChange();
    }
  };

  const openEditDialog = (folder: InquiryFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">询价文件夹</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建文件夹</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <Button onClick={handleCreateFolder} className="w-full">
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* All projects option */}
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          selectedFolderId === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground"
        )}
      >
        <Folder className="h-4 w-4" />
        全部项目
      </button>

      {/* Folder list */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group",
            selectedFolderId === folder.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          <button
            onClick={() => onSelectFolder(folder.id)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <Folder className="h-4 w-4" />
            <span className="truncate">{folder.name}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                  selectedFolderId === folder.id && "text-primary-foreground hover:bg-primary-foreground/20"
                )}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                <Pencil className="h-4 w-4 mr-2" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteFolder(folder)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="文件夹名称"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditFolder()}
            />
            <Button onClick={handleEditFolder} className="w-full">
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
