import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CalendarViewProps {
  propertyId?: string;
}

export function CalendarView({ propertyId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [blockReason, setBlockReason] = useState<"maintenance" | "owner_block">("maintenance");

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const calendarData = useQuery(
    propertyId 
      ? api.propertyManagement.getPropertyCalendar 
      : api.calendar.getHostCalendar,
    propertyId ? { propertyId: propertyId as any, month, year } : { month, year }
  );

  const blockDates = useMutation(api.propertyManagement.blockDates);
  const bulkBlockDates = useMutation(api.calendar.bulkBlockDates);
  const unblockDates = useMutation(api.propertyManagement.unblockDates);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getDateStatus = (date: Date) => {
    if (!calendarData) return "available";
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if date is blocked
    const isBlocked = (calendarData as any)?.blockedDates?.some((block: any) => 
      dateStr >= block.startDate && dateStr <= block.endDate
    );
    
    if (isBlocked) return "blocked";
    
    // Check if date is booked
    const isBooked = calendarData.bookings?.some(booking => 
      dateStr >= booking.checkIn && dateStr < booking.checkOut
    );
    
    if (isBooked) return "booked";
    
    return "available";
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const status = getDateStatus(date);
    
    if (status === "booked") return; // Can't select booked dates
    
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select dates to block");
      return;
    }

    try {
      const sortedDates = selectedDates.sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      if (propertyId) {
        await blockDates({
          propertyId: propertyId as any,
          startDate,
          endDate,
          reason: blockReason,
        });
      } else {
        // Bulk block for all properties
        const propertyIds = (calendarData as any)?.properties?.map((p: any) => p._id) || [];
        await bulkBlockDates({
          propertyIds,
          startDate,
          endDate,
          reason: blockReason,
        });
      }

      toast.success("Dates blocked successfully");
      setSelectedDates([]);
    } catch (error) {
      toast.error("Failed to block dates");
    }
  };

  const handleUnblockDate = async (blockId: string) => {
    try {
      await unblockDates({ blockId: blockId as any });
      toast.success("Date unblocked successfully");
    } catch (error) {
      toast.error("Failed to unblock date");
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-emerald-900">
          {propertyId ? "Property Calendar" : "Master Calendar"}
        </h3>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-emerald-600 hover:text-emerald-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h4 className="text-lg font-medium text-emerald-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-emerald-600 hover:text-emerald-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      {selectedDates.length > 0 && (
        <div className="mb-4 p-4 bg-emerald-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-emerald-700">
                {selectedDates.length} date(s) selected
              </span>
              
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value as "maintenance" | "owner_block")}
                className="px-3 py-1 border border-emerald-200 rounded-lg text-sm"
              >
                <option value="maintenance">Maintenance</option>
                <option value="owner_block">Owner Block</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDates([])}
                className="px-4 py-2 text-emerald-600 hover:text-emerald-800 text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleBlockDates}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
              >
                Block Dates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-emerald-600">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2"></div>;
          }
          
          const dateStr = date.toISOString().split('T')[0];
          const status = getDateStatus(date);
          const isSelected = selectedDates.includes(dateStr);
          const isToday = date.toDateString() === new Date().toDateString();
          
          let cellClass = "p-2 text-center text-sm cursor-pointer rounded-lg transition-colors ";
          
          if (isSelected) {
            cellClass += "bg-emerald-600 text-white ";
          } else if (status === "booked") {
            cellClass += "bg-red-100 text-red-800 cursor-not-allowed ";
          } else if (status === "blocked") {
            cellClass += "bg-yellow-100 text-yellow-800 ";
          } else {
            cellClass += "hover:bg-emerald-50 text-emerald-900 ";
          }
          
          if (isToday) {
            cellClass += "ring-2 ring-emerald-500 ";
          }
          
          return (
            <div
              key={index}
              className={cellClass}
              onClick={() => handleDateClick(date)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-emerald-50 rounded mr-2"></div>
          <span className="text-emerald-700">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
          <span className="text-emerald-700">Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
          <span className="text-emerald-700">Blocked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-emerald-600 rounded mr-2"></div>
          <span className="text-emerald-700">Selected</span>
        </div>
      </div>
    </div>
  );
}
