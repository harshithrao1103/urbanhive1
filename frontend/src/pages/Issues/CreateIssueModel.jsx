
import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { PlusCircle, MapPin, Edit3, Search } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import { addIssue } from "../../components/redux/issueSlice";

const CreateIssueModal = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    address: "",
    coordinates: [0, 0]
  });
  const [manualAddress, setManualAddress] = useState("");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const searchBoxInstance = useRef(null);

  const [formData, setFormData] = useState({
    issueType: "",
    description: "",
    priority: "",
    location: {
      type: "Point",
      coordinates: [0, 0],
    },
    images: "",
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              type: "Point",
              coordinates: [position.coords.longitude, position.coords.latitude],
            },
          }));
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not fetch your location.");
        }
      );
    } else {
      toast.error("Geolocation not supported by your browser.");
    }
  }, []);

  // Initialize Mapbox when map is shown
  useEffect(() => {
    if (showMap && !mapRef.current) {
      initializeMapbox();
    }
  }, [showMap]);

  const initializeMapbox = () => {
    // Load Mapbox GL JS dynamically
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
      document.head.appendChild(link);

      // Load Mapbox Search JS
      const searchScript = document.createElement('script');
      searchScript.src = 'https://api.mapbox.com/search-js/v1.0.0-beta.19/web.js';
      searchScript.onload = () => {
        const searchLink = document.createElement('link');
        searchLink.rel = 'stylesheet';
        searchLink.href = 'https://api.mapbox.com/search-js/v1.0.0-beta.19/web.css';
        document.head.appendChild(searchLink);

        // Initialize map and search box
        initializeMapAndSearch();
      };
      document.head.appendChild(searchScript);
    };
    document.head.appendChild(script);
  };

  const initializeMapAndSearch = () => {
    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2lyaWRldm9qdSIsImEiOiJjbHloZGdqYjIwMzVjMmtzYXowNjNzajRtIn0.5_fULxohRjzyjl9cKOL_mQ';

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937], // India center
      zoom: 4
    });

    // Add navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // Initialize Mapbox Search Box
    if (window.MapboxSearchBox) {
      searchBoxInstance.current = new window.MapboxSearchBox();
      searchBoxInstance.current.accessToken = mapboxgl.accessToken;
      searchBoxInstance.current.mapboxgl = mapboxgl;
      
      // Append search box to container
      if (searchBoxRef.current) {
        searchBoxRef.current.appendChild(searchBoxInstance.current);
      }

      // Event listener for when a user clicks on a search suggestion
      searchBoxInstance.current.addEventListener('retrieve', (event) => {
        console.log('[retrieve event] Fired:', event);
        const feature = event.detail.features[0];
        if (feature) {
          console.log('[retrieve event] Feature retrieved:', feature);
          const [lng, lat] = feature.geometry.coordinates;
          const name = feature.properties.name || feature.properties.place_formatted || 'Unnamed Location';
          showOnMap(lng, lat, name);
        } else {
          console.log('[retrieve event] No feature found in retrieve event.');
          toast.error('No location data found for the selected suggestion.');
        }
      });
    }

    // Handle map clicks
    mapRef.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      // Reverse geocoding
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        
        const address = data.features[0]?.place_name || `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`;
        
        setSelectedLocation({
          address,
          coordinates: [lng, lat]
        });

        // Update form data
        setFormData(prev => ({
          ...prev,
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
        }));

        // Add marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        markerRef.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setText(address))
          .addTo(mapRef.current);

        toast.success("Location selected!");
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        toast.error("Could not get address for this location.");
      }
    });
  };

  const showOnMap = (lng, lat, name) => {
    console.log(`[showOnMap] Called with: Lat=${lat}, Lng=${lng}, Name="${name}"`);

    // Validate coordinates and name
    if (typeof lng !== 'number' || typeof lat !== 'number' || !name) {
      console.error('[showOnMap] Invalid parameters received:', { lng, lat, name });
      toast.error('Invalid location data. Cannot display on map.');
      return;
    }

    console.log(`[showOnMap] Attempting to show on map: ${name} (Lat: ${lat}, Lng: ${lng})`);

    // Fly the map to the new location with a specific zoom level
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15, essential: true });

    // Remove any existing marker before adding a new one
    if (markerRef.current) {
      markerRef.current.remove();
      console.log('[showOnMap] Existing marker removed.');
    }

    // Create a new marker and set its coordinates
    markerRef.current = new window.mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(new window.mapboxgl.Popup({ offset: 25 }).setText(name))
      .addTo(mapRef.current);

    // Open the popup immediately
    markerRef.current.togglePopup();
    console.log('[showOnMap] New marker added and popup toggled.');

    // Update selected location
    setSelectedLocation({
      address: name,
      coordinates: [lng, lat]
    });

    // Update form data
    setFormData(prev => ({
      ...prev,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    }));

    toast.success("Location selected!");
  };

  const handleManualAddressChange = (e) => {
    setManualAddress(e.target.value);
    // Update form data with manual address
    setFormData(prev => ({
      ...prev,
      location: {
        type: "Point",
        coordinates: [0, 0], // Default coordinates for manual entry
      },
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImgUrl(previewUrl);

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/upload`,
        uploadData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const uploadedUrl = response.data.fileUrl;
      setFormData((prev) => ({ ...prev, images: uploadedUrl }));
      toast.success("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("File upload failed!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(addIssue(formData)).unwrap();
      if (!result || !result.issue || !result.issue._id) {
        throw new Error("Issue reporting failed");
      }
      toast.success("Issue reported successfully!");
      setOpen(false);
      setShowMap(false);
      setShowManualAddress(false);
      setSelectedLocation({ address: "", coordinates: [0, 0] });
      setManualAddress("");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to report issue!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report New Issue</DialogTitle>
          <DialogDescription>
            Describe the issue clearly so the community and authorities can respond.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Issue Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Issue Type</label>
            <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, issueType: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Waste Management">Waste Management</SelectItem>
                <SelectItem value="Public Transport">Public Transport</SelectItem>
                <SelectItem value="Air Pollution">Air Pollution</SelectItem>
                <SelectItem value="Housing">Housing</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Priority</label>
            <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, priority: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe the issue in detail"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Upload Image</label>
            <Input type="file" accept="image/*" onChange={handleFileUpload} />
            {imgUrl && <img src={imgUrl} alt="Preview" className="w-full max-h-64 object-cover mt-2 rounded-lg" />}
          </div>

          {/* Location Selection */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowMap(!showMap);
                    setShowManualAddress(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {showMap ? "Hide Map" : "Add Address from Map"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowManualAddress(!showManualAddress);
                    setShowMap(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Manual Address Entry
                </Button>
              </div>
              
              {/* Map-based location selection */}
              {showMap && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Search Box */}
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-500" />
                        <div 
                          ref={searchBoxRef}
                          className="flex-1"
                          style={{
                            '--mapboxgl-ctrl-geocoder--input': '100% !important',
                            '--mapboxgl-ctrl-geocoder--input-border-radius': '0.5rem',
                            '--mapboxgl-ctrl-geocoder--input-padding': '0.75rem 1rem',
                            '--mapboxgl-ctrl-geocoder--input-font-size': '1rem',
                            '--mapboxgl-ctrl-geocoder--input-border': 'none',
                            '--mapboxgl-ctrl-geocoder--input-outline': 'none',
                            '--mapboxgl-ctrl-geocoder--suggestions-border-radius': '0.5rem',
                            '--mapboxgl-ctrl-geocoder--suggestions-box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
                            '--mapboxgl-ctrl-geocoder--suggestions-background-color': 'white',
                            '--mapboxgl-ctrl-geocoder--suggestions-z-index': '1000',
                            '--mapboxgl-ctrl-geocoder--suggestion-hover-background-color': '#f0f4f8'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div ref={mapContainerRef} className="h-64 w-full" />
                  <div className="p-3 bg-gray-50 text-xs text-gray-600">
                    Click on the map to select a location or use the search box above.
                  </div>
                </div>
              )}

              {/* Manual address entry */}
              {showManualAddress && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter the address manually..."
                    value={manualAddress}
                    onChange={handleManualAddressChange}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the complete address including street, city, and postal code.
                  </p>
                </div>
              )}

              {/* Display selected location */}
              {(selectedLocation.address || manualAddress) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Selected Location:</p>
                  {selectedLocation.address && (
                    <>
                      <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {selectedLocation.coordinates[0].toFixed(6)}, {selectedLocation.coordinates[1].toFixed(6)}
                      </p>
                    </>
                  )}
                  {manualAddress && (
                    <p className="text-sm text-gray-600">{manualAddress}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full mt-4">
            Submit Issue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIssueModal;
