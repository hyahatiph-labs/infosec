# Monero Ring Output Indices Data Visualization
# Hyahatiph Labs, 2022
# Author: https://github.com/hyahatiph-labs
# MIT LICENSE

# Connect to the analytics database
library(DBI)
library(RODBCDBI)
library(readr)
# create an /infosec/analitiko/.Renviron file with
# PG_USER=<postgresql username>
# PG_CRED=<postgresql password>
# PG_DB_NAME=<database_name>
# PG_HOST=<host of postgresql server>
# SHINY_PORT=<port to run shiny server>
# when adding new variable to .Renviron
# close and re-open if using RStudio
pg_user <- Sys.getenv("PG_USER")
pg_cred <- Sys.getenv("PG_CRED")
pg_host <- Sys.getenv("PG_HOST")
pg_port <- Sys.getenv("PG_PORT")
shiny_port <- Sys.getenv("SHINY_PORT")
pg_db_name <- Sys.getenv("PG_DB_NAME")
con <- dbConnect(odbc::odbc(), driver = "PostgreSQL",Server = pg_host,
                 Database = pg_db_name, UID = pg_user, PWD = pg_cred,
                 Port = pg_port)

# Data Viz Libraries
library(igraph)
library(tidygraph)
library(networkD3)

block_time <- 120000
# This function is used to wrap the extract, transact load process
# for automation inside of the Shiny app server
etl <- function() {
  # create a data frame giving the hierarchical structure of your individuals.
  # Origin on top, then groups, then subgroups
  # D1 - from (block height) | to (tx hash)
  qD1 <- dbSendQuery(con,
                     'SELECT
                    t1.height,
                    t2.hash
                    FROM "Blocks" t1 
                    LEFT JOIN "Txes" t2 ON t1.height = t2.height')
  rD1 <- dbFetch(qD1)
  # D2 - from (tx hash) | to (ring output indices)
  qD2 <- dbSendQuery(con, 
                     'SELECT
                    t1.hash,
                    t1."ringOutputIndices"
                    FROM "Txes" t1')
  rD2 <- dbFetch(qD2)
  # close but let us create a new data frame with individual
  # ring output index per hash
  hash <- NULL
  index <- NULL
  t <- 1
  j <- 1
  for (h in rD2$hash) {
    v1 <- strsplit(rD2$ringOutputIndices[t], split = "[{}]")
    v2 <- unlist(v1[1])[2]
    v3 <- unlist(strsplit(v2, split = ","))
    for (r in v3) {
      hash[j] <- h
      index[j] <- readr::parse_number(r)
      j <- j + 1
    }
    t <- t + 1
  }

  v_hash <- unlist(hash)
  v_index <- unlist(index)
  d1 <- NULL
  d2 <- NULL
  d1 <- data.frame(from = rD1$height, to = rD1$hash)
  d2 <- data.frame(from = v_hash, to = v_index)
  # Hierarchical Network Graph
  hierarchy <- rbind(d1, d2)
  hierarchy <- na.omit(hierarchy)
  # TODO: benchmarking with samples. Need a machine that can render this
  set.seed(6969)
  hierarchy[sample(nrow(hierarchy), 10000, replace = FALSE, prob = NULL),]
}
hierarchy <- etl()
length(hierarchy$from)

# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above in RStudio.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

library(shiny)
port <- readr::parse_integer(shiny_port)
options(shiny.port = port, shiny.host = "0.0.0.0")
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
                        max = length(hierarchy$from),
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
        simpleNetwork(hierarchy[1:input$txs,], width = "100px",
                          height = "100px",
                           Source = 1,                 # column number of source
                           Target = 2,                 # column number of target
                           linkDistance = 10,          # distance between node.
                           charge = -900,              # interaction strength
                           fontSize = 20,              # size of the node name
                           fontFamily = "serif",       # font of node names
                           linkColour = "#000",        # color of edges
                           nodeColour = "#FF5722",     # color of nodes
                           opacity = 0.9,              # opacity of nodes.
                           zoom = T                    # Enable zoom
        )
    })

    # keep refreshing the data on par with Monero block time
    observe({
      invalidateLater(block_time)
      isolate(hierarchy <- etl())
    })

 }

# Run the application 
shinyApp(ui = ui, server = server)
