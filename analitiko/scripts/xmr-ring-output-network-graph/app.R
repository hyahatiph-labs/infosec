
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above in RStudio.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

library(shiny)
library(networkD3)
port <- readr::parse_integer(shiny_port)
options(shiny.port = port)
# Define UI for application that draws a histogram
ui <- fluidPage(

    # Application title
    titlePanel("Monero Ring Output Indices Network Graph"),

    # Sidebar with a slider input for number of bins 
    sidebarLayout(
        sidebarPanel(
            sliderInput("txs",
                        "Number of transactions",
                        min = 1,
                        max = length(d1$from),
                        value = 10)
        ),

        # Show a plot of the ring output indices for transactions at height n
        mainPanel(
          simpleNetworkOutput(
            "nPlot", width = "100%", height = "700px"
          )
        )
    )
)


# Define server logic required to draw a plot
 server <- function(input, output) {

    output$nPlot <- renderSimpleNetwork({
        # draw the plot with the specified number of transactions
        simpleNetwork(hierarchy[1:input$txs,], width = "100px", height = "100px",
                           Source = 1,                 # column number of source
                           Target = 2,                 # column number of target
                           linkDistance = 10,          # distance between node.
                           charge = -900,              # interaction strength
                           fontSize = 20,              # size of the node name
                           fontFamily = "serif",       # font of node names
                           linkColour = "#000",        # color of edges
                           nodeColour = "#FF5722",     # color of nodes
                           opacity = 0.9,              # opacity of nodes.
                           zoom = T                    # Can you zoom on the figure?
        )
    })
 }

# Run the application 
shinyApp(ui = ui, server = server)
