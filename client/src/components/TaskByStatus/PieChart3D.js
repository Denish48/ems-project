import React, { useEffect, useState } from "react";
import AmCharts from "@amcharts/amcharts3-react";
import Service from "../../service";

const PieChart3D = () => {
  const [surveyaData, setSurveyData] = useState([]);

  useEffect(() => {
    getsatisfaction();
  }, []);

  const getsatisfaction = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.employeessurvey,
      });
      if (response.data && response.data.data) {
        const satificationData = response.data.data
        let count = 0;
        for (const key in satificationData) {
          if (Object.hasOwnProperty.call(satificationData, key)) {
            const element = satificationData[key];
            count += element;
          }
        }
        if (count > 0) {
          const data = [
            {
              "Satisfaction": "Very Satisfied",
              "value": satificationData.very_satisfied
            },
            {
              "Satisfaction": "Satisfied",
              "value": satificationData.satisfied
            }, {
              "Satisfaction": "Good",
              "value": satificationData.good
            }, {
              "Satisfaction": "Bad",
              "value": satificationData.bad
            }, {
              "Satisfaction": "Very Bad",
              "value": satificationData.very_bad
            }
          ]
          setSurveyData(data);
        } else {
          setSurveyData([])
        }
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  if (surveyaData.length === 0) {
    return null;
  }
  return (
    <AmCharts.React style={{ width: "400px", height: "400px" }} options={{
      "hideCredits": true,
      "type": "pie",
      "theme": "light",
      "valueField": "value",
      "titleField": "Satisfaction",
      "outlineAlpha": 0.4,
      "depth3D": 15,
      "balloonText": "[[title]]<br><span style='font-size:14px'><b>[[value]]</b> ([[percents]]%)</span>",
      "angle": 30,
      "export": {
        "enabled": true
      },
      "dataProvider": surveyaData,
    }} />

    // <div style={{ width: "100%", margin: "auto" }}>
    //   <AmCharts4Wrapper
    //     config={config}
    //     id="amcharts-4"
    //     chartTypeClass={PieChart}
    //   />
    // </div>
  )
}

export default PieChart3D;
