import { Component, ViewChild } from "@angular/core";
import {
    ChartComponent,
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexYAxis,
    ApexDataLabels,
    ApexStroke,
    ApexGrid
} from "ng-apexcharts";

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    yaxis: ApexYAxis;
    xaxis: ApexXAxis;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    colors: any;
    stroke: ApexStroke;
};

@Component({
    selector: 'app-evenement-template',
    templateUrl: './evenement-template.component.html',
    styleUrls: ['./evenement-template.component.scss']
})
export class EvenementTemplateComponent {

    @ViewChild("chart") chart: ChartComponent | undefined;
    public chartOptions: Partial<ChartOptions>;

    constructor() {
        this.chartOptions = {
            series: [
                {
                    name: "Participants",
                    data: [10, 20, 15, 30, 25, 40, 50]
                }
            ],
            chart: {
                height: 350,
                type: "line",
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: ["#1cbe72"],
            stroke: {
                curve: "straight"
            },
            grid: {
                show: true,
                strokeDashArray: 5
            },
            xaxis: {
                categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
            },
            yaxis: {}
        };
    }
}