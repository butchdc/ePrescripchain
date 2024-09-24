import { useEffect, useState } from 'react';
import axios from 'axios';
import { Chrono } from 'react-chrono';

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const TimeLine = ({prescriptionID}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiBaseURL}prescriptions/status-timestamps/${prescriptionID}?sortColumn=timestamp&sortOrder=DESC`);

        const transformedItems = response.data.map(item => ({
          cardTitle: `${new Date(item.timestamp).toLocaleString()} - ${item.status}`,
          cardSubtitle: item.notes,
        }));

        setItems(transformedItems);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (

    <div>
      {items.length > 0 ? (
        <Chrono 
          style={{fontSize:12}}
          items={items} 
          mode="VERTICAL" 
          textDensity= 'LOW'
          disableToolbar
          theme={{ primary: '#8884d8', secondary: '#82ca9d' }}
          itemWidth={200}
          scrollable={true}
          fontSizes={{
            cardTitle: '0.7rem',
            cardSubtitle: '0.6rem',
          }}
        />
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default TimeLine;
