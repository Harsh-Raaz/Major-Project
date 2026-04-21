import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSearchHistory, clearSearchHistory } from '../utils/storage';
import { AlertCircle, Trash2, Hospital, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SearchHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const hist = getSearchHistory();
    setHistory(hist);
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all search history?')) {
      clearSearchHistory();
      setHistory([]);
      toast.success('Search history cleared');
    }
  };

  const handleViewResult = (item) => {
    if (item.type === 'hospital') {
      navigate(`/doctors/${item.id}?hospital=${encodeURIComponent(item.name)}`);
    } else if (item.type === 'doctor') {
      navigate(`/slots/${item.id}?doctorName=${encodeURIComponent(item.name)}`);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-950">Search History</h2>
          <p className="mt-2 text-blue-700">Recently viewed hospitals and doctors</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Clear History
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {history.map((item, index) => (
            <div
              key={index}
              onClick={() => handleViewResult(item)}
              className="cursor-pointer rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                {item.type === 'hospital' ? (
                  <Hospital size={20} className="text-blue-600" />
                ) : (
                  <Stethoscope size={20} className="text-emerald-600" />
                )}
                <span className="text-xs font-semibold uppercase text-blue-600">
                  {item.type}
                </span>
              </div>
              <h3 className="font-bold text-blue-950">{item.name}</h3>
              {item.department && <p className="text-sm text-blue-700">{item.department}</p>}
              {item.rating && <p className="text-sm text-blue-600">Rating: ★ {item.rating}</p>}
              <p className="mt-3 text-xs text-blue-500">
                Viewed: {new Date(item.timestamp).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-blue-100 p-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-blue-400" />
          <p className="text-lg font-semibold text-blue-900">No search history</p>
          <p className="text-sm text-blue-700">Start searching for hospitals to see them here</p>
        </div>
      )}
    </div>
  );
}
