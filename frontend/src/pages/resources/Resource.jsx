
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchResources, addResouce } from "../../components/redux/resourceSlice";
import { X, Plus, Tag, DollarSign, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

function Resource() {
  const dispatch = useDispatch();
  const { resources, isLoading } = useSelector((state) => state.resource);
  const { user } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [newResource, setNewResource] = useState({
    name: "",
    category: "",
    status: "available",
    price: 0,
    imageBase64: "",
    description: "",
    contact: "",
  });

  useEffect(() => {
    dispatch(fetchResources());
  }, [dispatch]);

  const handleDelete = async (resourceId) => {
    try {
      await fetch(`http://localhost:8000/api/resources/${resourceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Resource deleted!");
      dispatch(fetchResources());
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete resource");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewResource({ ...newResource, imageBase64: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addResouce(newResource))
      .then(() => {
        toast.success("Resource added successfully");
        setNewResource({
          name: "",
          category: "",
          status: "available",
          price: 0,
          imageBase64: "",
          description: "",
          contact: "",
        });
      })
      .catch(() => {
        toast.error("Failed to add resource");
      });
  };

  const filteredResources = resources.filter((resource) => {
    const matchesFilter = filter === "all" || resource.category === filter;
    const matchesSearch = resource.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Resources</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-800">
                Add New Resource
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Resource Name</Label>
                <Input
                  id="name"
                  placeholder="Enter resource name"
                  className="w-full"
                  value={newResource.name}
                  onChange={(e) =>
                    setNewResource({ ...newResource, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Details</Label>
                <Input
                  id="contact"
                  placeholder="Enter phone/email"
                  className="w-full"
                  value={newResource.contact}
                  onChange={(e) =>
                    setNewResource({ ...newResource, contact: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Resource Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the resource"
                  className="w-full"
                  value={newResource.description}
                  onChange={(e) =>
                    setNewResource({ ...newResource, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) =>
                    setNewResource({ ...newResource, category: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Household Items",
                      "Electronics & Gadgets",
                      "Books & Stationery",
                      "Clothing & Accessories",
                      "Tools & Equipment",
                      "Food & Essentials",
                      "Health & Hygiene",
                      "Kids & Baby Items",
                      "Sports & Fitness",
                      "Sustainable Living",
                      "Educational & Office Supplies",
                    ].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price"
                  className="w-full"
                  value={newResource.price}
                  onChange={(e) =>
                    setNewResource({ ...newResource, price: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white">
                Add Resource
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search resources..."
          className="w-full p-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {[
              "Household Items",
              "Electronics & Gadgets",
              "Books & Stationery",
              "Clothing & Accessories",
              "Tools & Equipment",
              "Food & Essentials",
              "Health & Hygiene",
              "Kids & Baby Items",
              "Sports & Fitness",
              "Sustainable Living",
              "Educational & Office Supplies",
            ].map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <h1 className="text-xl font-semibold">Loading...</h1>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <div
                key={resource._id}
                className="relative border rounded-lg p-4 shadow-lg">
                {user?._id === resource.owner && (
                  <button
                    onClick={() => handleDelete(resource._id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    title="Delete resource"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {resource.images && (
                  <img
                    src={resource.images}
                    alt={resource.name}
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                )}
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-500" /> {resource.name}
                </h2>
                <p className="text-gray-700">{resource.description}</p>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-500" /> ₹{resource.price}
                </p>
                <p className="text-sm mt-2 flex items-center gap-1">
                  <strong>Status:</strong>
                  <span className={resource.status === "available" ? "text-green-500" : "text-red-500"}>
                    {` ${resource.status}`}
                  </span>
                </p>
                <p className="text-sm flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" /> ⭐ {resource.ratings} / 5
                </p>
                <p className="text-sm mt-1 text-gray-600">
                  <strong>Contact:</strong> {resource.contact}
                </p>
              </div>
            ))
          ) : (
            <p>No resources available.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Resource;
