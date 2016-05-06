export default function Tooltip(options) {

  console.log(options)

  var w=options.width,
    h=options.height;

  var positioner = d3.select(options.positioner)  

  var tooltip=d3.select(options.container) //'#mapHolder'
          .append("div")
            .attr("class","tooltip arrow_box clearfix")
            .style("height", function(){
              return h+"px";
            })
            .style("width",function(){
              return w+"px";
            })

  // var tooltipTitle=tooltip.append("h1")
  //       .attr("id","titleTxt")
  //       .attr("class","tooltip-title");   
  

  var indicator=tooltip.selectAll("div.indicator")
      .data(options.indicators,function(d){
        return d.id;
      })
      .enter()
      .append("div")
        .attr("class","indicator clearfix")

  var value = indicator.append("span")
        .attr("class","value")
        .attr("id",function(d){
          return d.id;
        });

        // indicator.append("span")
        // .attr("class","title")
        // .text(function(d){

        //   return d.title;
        // });


  this.hide=function() {
    tooltip.classed("visible", false);
  };

  this.show=function(data,x,y,title) {

    var htmlStr = "Arsenal "+data.For+" – "+data.Against+" "+data.Opponent;
   
    if (data.Where == "A"){ htmlStr = data.Opponent+" "+data.Against+" – "+data.For+" Arsenal"}

   // tooltipTitle.text(function(d) {return data.Competition} )

    indicator.select("#govLeader")
      .attr("class","value-emphasis")
      .text(function(d){
        //console.log("AAAHHHHHHHHHH",d,this)
        return (htmlStr);
      })

    indicator.select("#govParty")
      .text(function(d){ "ciao ciao ciao"  })      

    tooltip.style({
      left:(x)+"px",  //+16+options.margins.left
      top:(0)+"px" //+options.margins.top-60
    })

    tooltip.classed("visible",true)

    // console.log("work on this line tomorrow to position arrow pointer - also final var undefined when dragging out to right");
    // tooltip.arrow_box.style({left:"60px"})
  };


}





// var tooltipPlayer=new Tooltip({
//       container:partnershipTimeline.node(),
//       margins:margins,
//       indicators:[
//         {
//           id:"playerRuns",
//           title:"Runs"
//         },
//         {
//           id:"playerBalls",
//           title:"Balls"
//         },
//         /*{
//           id:"playerSR",
//           title:"SR"
//         },*/
//         {
//           id:"playerFourSix",
//           title:"4s/6s"
//         }
//       ]
//     })


