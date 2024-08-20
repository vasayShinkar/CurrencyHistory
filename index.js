const  width = 600,
 height = 300,
 margin = 25;
let data = {timetable: null, ability: null, type: null }
let timetable_element = document.querySelector(".timetable");
let ability_element = document.querySelector(".ability");
let type_element = document.querySelector(".type");
let svg = d3.select(".container svg");

let mousedown = false;
let fromPrice = null;
 [timetable_element, ability_element, type_element].forEach(elem => {
    elem.addEventListener("change", (event) => {
         let item = event.target;
         data[item.className] = item.value
        createDiagam(data.timetable || 24 * 10, data.type || "wawes", data.ability || "changes")
    })  
})


svg[0][0].addEventListener("mousedown", e => {
    let value = e.target.dataset.value
    if(!value) return;
    mousedown = true;
    fromPrice = e.target;
})

document.addEventListener("mousemove", e => {
    if(!mousedown || !fromPrice || !e.target.dataset.value) return;
    let toPrice = e.target;
    if(svg.select(".compareArea")) svg.select(".compareArea").remove()
    let area =  svg.append("g").classed("compareArea", true)

    area.append("line")
    .attr("x1", fromPrice.x.animVal.value + 15)
    .attr("x2", toPrice.x.animVal.value + 15)
    .attr("y1", fromPrice.y.animVal.value)
    .attr("y2", toPrice.y.animVal.value)

    area.append("line")
    .attr("x1", fromPrice.x.animVal.value + 15)
    .attr("x2", toPrice.x.animVal.value + 15)
    .attr("y1", fromPrice.y.animVal.value)
    .attr("y2", fromPrice.y.animVal.value)

    area.append("text")
    .attr("x", (fromPrice.x.animVal.value + toPrice.x.animVal.value)/2 )
    .attr("y", fromPrice.y.animVal.value - 5 )
    .text(Math.abs(fromPrice.dataset.time - toPrice.dataset.time)/24/60/60)

    area.append("text")
    .attr("x", toPrice.x.animVal.value + 20)
    .attr("y", (fromPrice.y.animVal.value + toPrice.y.animVal.value)/2 )
    .text(parseInt(toPrice.dataset.value - fromPrice.dataset.value ))

    area.append("line")
    .attr("x1", toPrice.x.animVal.value + 15)
    .attr("x2", toPrice.x.animVal.value + 15)
    .attr("y1", fromPrice.y.animVal.value)
    .attr("y2", toPrice.y.animVal.value)
    .style("stroke", fromPrice.y.animVal.value - toPrice.y.animVal.value < 0 ? "rgb(255, 85, 85)" : "rgb(2, 255, 2)")

 })

 svg[0][0].addEventListener("mouseup", e => {
    mousedown = false;
    fromPrice = null;
    createDiagam(data.timetable || 24 * 10, data.type || "wawes", data.ability || "changes")

})

 
async function getDate(timetable) {
  let req = await fetch(`https://min-api.cryptocompare.com/data/histoday?fsym=BTC&tsym=USD&limit=${timetable/24}`) 
  let json = await req.json()
  return json;
} 

createDiagam(24*50, "wawes", "changes")



async function createDiagam(timetable, type, ability) {
    let data = await getDate(+timetable);
    svg.html("")
    let bounraries = findTheBoundaries(data.Data)

    let scaleX = d3.time.
    scale()
    .domain([new Date((data.TimeFrom - 60*60*24*2) * 1000), new Date((data.TimeTo + 60*60*24) * 1000)])
    .range([0,width])

    let scaleY = d3.scale.linear()
    .domain([bounraries.low, bounraries.high + 600])
    .range([height, 0])

    let axisX = d3.svg.axis().scale(scaleX).orient("bottom")
    let axisY = d3.svg.axis().scale(scaleY).orient("right")

    svg.append("g")
    .classed("axis_x", true)
    .call(axisX)
    .attr("transform", `translate(30, ${height - margin})`)
    svg.append("g")
    .classed("axis_y", true)
    .call(axisY)
    .attr("transform", `translate(30, -${margin})`)
    
    svg.selectAll("g.axis_y g.tick").append("line")
    .attr("x1", 0).attr("x2", width).attr("y1",0).attr("y2", 0)

    svg.selectAll("g.axis_x g.tick").append("line")
    .attr("x1", 0).attr("x2", 0).attr("y1",0).attr("y2", -height)

    svg.append("g").selectAll("rect.bars").data(data.Data).enter().append("rect").attr("data-value", e=>e.open).attr("data-time", e=>e.time).classed("bars", true)
    .attr("x", e=>scaleX(new Date(e.time*1000)))
    .attr("y", d=>scaleY(d.open) - margin)
    .attr("height",d=>height - scaleY(d.open))
    .attr("width", (width - margin - 60) / data.Data.length)
    .attr("transform", "translate(15,0)")

    if(type == "wawes") {
    let line = d3.svg.line().interpolate("cardinal").x(d=>{
        return scaleX(new Date(d.time*1000))
    }).y(d=>scaleY(d.open))

    svg.append("path").classed("mainLine", true)
    .attr("d", line(data.Data))
    .attr("transform", `translate(15, ${-1*margin})`)
   }
   if(ability == "changes") {
    svg.append("g")
    .selectAll("rect.change")
    .data(data.Data)
    .enter()
    .append("rect")
    .attr("class", d => {
        return d.close-d.open > 0 ? " change h" : "change l"
    })
    .attr("x", e=>scaleX(new Date(e.time*1000)))
    .attr("y", d=> {
        return scaleY(d.close) - scaleY(d.open) > 0 ?   scaleY(d.open) - margin  : scaleY(d.open) - margin-Math.abs(scaleY(d.close) - scaleY(d.open))
    })
    .attr("height",d=> Math.abs(scaleY(d.close) - scaleY(d.open)))
    .attr("width", (width - margin - 60) / data.Data.length)
    .attr("transform", "translate(15,0)")
   }

}

function findTheBoundaries(data) {
    return data.reduce((r,v) => {
        if(v.high > r.high) {
            r.high = v.high
        }
        if(v.low < r.low)  {
            r.low = v.low
        }
        return r
    }, {low: 100000000, high: -100000000})
}