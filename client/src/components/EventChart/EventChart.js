import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import Widget from "../Widget";

const EventChart = ({ eventApiData }) => {
  let event_seats = eventApiData?.event_seats ? eventApiData?.event_seats : 0;
  let seats_booked = eventApiData?.seats_booked ? eventApiData?.seats_booked : 0;
  let available_seats = event_seats - seats_booked;
  // if (seats_booked > 0 && seats_booked === event_seats) {
  //   event_seats = 0;
  // }
  const data = [
    { name: 'Available Seats', value: available_seats },
    { name: 'Seats Booked', value: seats_booked },
  ];

  const COLORS = ['#5797fc', '#FA8C16', '#f5222d', '#d9d9d9'];
  return (
    <Widget styleName="gx-text-center">
      <div className="gx-py-3">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Tooltip />
            <text
              x="50%" className="p"
              y="50%" textAnchor="middle" dominantBaseline="middle">
              Events Seats
            </text>
            <Pie
              data={data} dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={43}
              outerRadius={57}
              fill="#8884d8"
            >
              {
                data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)
              }
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
};
export default EventChart;
