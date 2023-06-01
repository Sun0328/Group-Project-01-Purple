window.addEventListener("load", async function () {

    const response = await this.fetch(`../analyticsChart`);
    const json = await response.json();

    const commentNumberData = json;
    let xValues = [];
    let yValues = [];
    for (let i = 0; i < commentNumberData.length; i++)
    {
        const item = commentNumberData[i];
        const data = item.data;
        const number = item.count;
        xValues.push(data);
        yValues.push(number);
    }
    
    new Chart("myChart", {
      type: "line",
      data: {
        labels: xValues,
        datasets: [{
          fill: false,
          lineTension: 0,
          backgroundColor: "rgba(186,147,210,1.0)",
          borderColor: "rgba(186,147,210,0.1)",
          data: yValues
        }]
      },
      options: {
        legend: {display: false},
        scales: {
          yAxes: [{ticks: {min: 0, max:50}}],
        },
        title: {
            display: true,
            text: "last ten days' daily comment number"
          }
      }
    });

    var barColors = [
        "rgba(186,147,210,1.0)",
        "rgba(186,147,210,0.8)",
        "rgba(186,147,210,0.6)",
        "rgba(186,147,210,0.4)",
        "rgba(186,147,210,0.2)",
        "rgba(186,147,210,1.0)",
        "rgba(186,147,210,0.8)",
        "rgba(186,147,210,0.6)",
        "rgba(186,147,210,0.4)",
        "rgba(186,147,210,0.2)"
    ];
    new Chart("myChart2", {
        type: "bar",
        data: {
            labels: xValues,
            datasets: [{
                backgroundColor: barColors,
                data: yValues
            }]
        },
        options: {
            legend: {display: false},
	        scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
            display: true,
            text: "last ten days' daily comment number"
            }
        }
    });
})