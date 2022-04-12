# K-means Clustering: Monero Transaction Fee
# Exploratory Data Analysis
# Hyahatiph Labs, 2022
# Author: https://github.com/hyahatiph-labs
# MIT LICENSE

dev_env <- Sys.getenv("DEV_ENV")
if (dev_env != "local") {
  local({r <- getOption("repos")
         r["CRAN"] <- "http://cran.r-project.org"
         options(repos=r)})
  
  install.packages(c("DBI", "RODBC", "odbc", "dplyr", "RODBCDBI",
    "readr", "data.table", "cluster", "NbClust", "factoextra",
    "psych", "party", "ggplot2", "reshape2", "shiny",
    "igraph", "tidygraph", "networkD3", "curl")) 
}

# Connect to the analytics database
library(DBI)
library(RODBCDBI)
library(readr)
library(data.table)
# Initialize library for kmeans clustering and elbow method
library(cluster)
library(NbClust)
library(factoextra)
# Some tools for exploratory data analysis
library(psych)
library(party)
# Create an /infosec/analitiko/.Renviron file with
# DEV_ENV=<local or docker>
# PG_USER=<postgresql username>
# PG_CRED=<postgresql password>
# PG_DB_NAME=<database_name>
# SHINY_PORT=<port to run shiny server>
# when adding new variable to .Renviron
# close and re-open if using RStudio
pg_user <- Sys.getenv("PG_USER")
pg_cred <- Sys.getenv("PG_CRED")
pg_host <- Sys.getenv("PG_HOST")
shiny_port <- Sys.getenv("SHINY_PORT")
pg_db_name <- Sys.getenv("PG_DB_NAME")
con <- dbConnect(odbc::odbc(), driver = "PostgreSQL", Server = pg_host,
                 Database = pg_db_name, UID = pg_user, PWD = pg_cred,
                 Port = 5432)

block_time <- 120000
second_std <- .977
# Set outlier threshold
oth <- function(value, limit) {
  u <- mean(value)
  (value * u) + u
}
# This function returns a modified dataset for the Shiny server
etl <- function() {
  # Transaction Fee Dataset
  qTxs <- dbSendQuery(con, 'SELECT * FROM "Txes" t1')
  rTxs <- dbFetch(qTxs)

  kb <- 1024
  pico <- 1000000000000
  tx_fee_dataset <- data.table(
    height = rTxs$height,
    fee = rTxs$rctSigFee / pico,
    size = rTxs$size,
    num_inputs = rTxs$numInputs,
    num_outputs = rTxs$numOutputs,
    fee_per_byte = (rTxs$rctSigFee / pico) / rTxs$size / kb
  )
  # Reproducible output
  set.seed(1234)
  # Summary stats
  summary(tx_fee_dataset)
  # Dataset structure
  str(tx_fee_dataset)
  # Class variable distribution
  plot(tx_fee_dataset$fee)
  # Create correlation matrix with heatmap
  cormat <- round(cor(tx_fee_dataset[1:6]),2)
  head(cormat)
  library(reshape2)
  melted_cormat <- melt(cormat)
  head(melted_cormat)
  library(ggplot2)
  ggplot(data = melted_cormat, aes(x = Var1, y = Var2, fill = value)) +
    geom_tile()
  priority_level <- NULL
  unimportant <- 0.00000005
  low <- 0.00000015
  elevated <- 0.00000025
  i <- 1
  for (fee in tx_fee_dataset$fee_per_byte) {
    if (fee < unimportant) {
      priority_level[i] <- "unimportant"
    } else if (fee < low) {
      priority_level[i] <- "low"
    } else if (fee < elevated) {
      priority_level[i] <- "elevated"
    } else {
      priority_level[i] <- "default"
    }
    i <- i + 1
  }
  v_priority_level = unlist(priority_level)
  tx_fee_dataset$class <- v_priority_level
  # Copy the dataset
  tx_fee_dataset2 <- tx_fee_dataset
  # Remove the class variable and time
  tx_fee_dataset2$class <- NULL
  tx_fee_dataset2$height <- NULL
  # Store the model with 4 clusters
  kc <- kmeans(tx_fee_dataset2, 4, iter.max = 40)
  # Print the model output
  print(kc)
  # Between sum of squares
  kc$betweenss
  # Compare the model with the classes
  table(tx_fee_dataset$class, kc$cluster)
  # Model variations
  # K-means method with k=2
  kc <- kmeans(tx_fee_dataset2, 2, iter.max = 20)
  kc
  kc$betweenss
  # K-means method with k=3
  kc <- kmeans(tx_fee_dataset2, 3, iter.max = 30)
  kc
  kc$betweenss
  # Model Refinement - set outlier thresholds for size and fee
  size_outlier_threshold <- oth(tx_fee_dataset2$size, second_std)
  fee_outlier_threshold <- oth(tx_fee_dataset2$fee, second_std)
  rm_outliers_tx_fee_dataset <-
    subset(tx_fee_dataset2, tx_fee_dataset2$size < size_outlier_threshold)
  final_data_set <-
    subset(rm_outliers_tx_fee_dataset,
      rm_outliers_tx_fee_dataset$fee < fee_outlier_threshold)
  # K-means method with k= 4
  kc <- kmeans(final_data_set, 4, iter.max = 40)
  clusplot(final_data_set, kc$cluster,
    color = TRUE, shade = TRUE, labels = 4, lines = 0)
  # Bubble data visualization via r-graph-gallery
  # https://r-graph-gallery.com/2d-density-chart.html

  # Bin size control + color palette
  ggplot(final_data_set, aes(x = fee_per_byte, y = size)) +
    geom_bin2d(bins = 70) +
    scale_fill_continuous(type = "viridis") +
    theme_bw()
  # Strip away outliers
  final_data_set
}

# Initial Extract, Transfer and Load
tx_fee_dataset <- etl()
analitiko_height <- max(tx_fee_dataset$height)
print(analitiko_height)
kc <- kmeans(tx_fee_dataset, 4, iter.max = 40)

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
  titlePanel("Monero Transaction Fee Scatter Plot"),
  column(
      width = 4,
      sliderInput("txs",
                  "Number of transactions",
                  min = 1,
                  max = length(tx_fee_dataset$size),
                  value = 10),
      hr(),
      h3("Cluster Centers"),
      tableOutput("centerTable"),
      h3("Within Sum of Squares"),
      tableOutput("withinTable"),
      h3("Between SS / Total SS"),
      h4(kc$betweenss / kc$totss)
    ),
    # Show a plot of the transaction fee per byte versus size
    mainPanel(
      plotOutput(
        "sPlot", width = "100%", height = "700px"
      ),
      plotOutput(
        "cPlot", width = "100%", height = "700px"
      )
    )
  )

# Define server logic required to draw a plot
server <- function(input, output) {
  # outlier-free plot
  output$sPlot <- renderPlot({
    # draw the plot with the specified number of transactions
    # Bin size control + color palette
    ggplot(tx_fee_dataset[1:input$txs,],
      aes(x=fee_per_byte, y=size)) +
      geom_bin2d(bins = 70) +
      scale_fill_continuous(type = "viridis") +
      theme_bw()
  })
  # Cluster center table
  output$centerTable <- renderTable({
    data.table(kc$centers)
  })
  # within sum of squares table
  output$withinTable <- renderTable({
    data.table(kc$withinss)
  })
  # original cluster plot
  output$cPlot <- renderPlot({
    clusplot(tx_fee_dataset, kc$cluster,
    color = TRUE, shade = TRUE, labels = 4, lines = 0)
  })
  observe({
    invalidateLater(block_time)
    isolate(tx_fee_dataset <- etl())
    isolate(kc <- kc <- kmeans(tx_fee_dataset, 4, iter.max = 40))
    print(analitiko_height)
  })
}
# Run the application
shinyApp(ui = ui, server = server)
