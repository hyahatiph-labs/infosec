# K-means Clustering: Monero Transaction Fee
# Exploratory Data Analysis
# Hyahatiph Labs, 2022
# Author: https://github.com/hyahatiph-labs
# MIT LICENSE

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
library(ggplot2)
library(reshape2)
# Create an /infosec/analitiko/.Renviron file with
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
pg_db_name <- Sys.getenv("PG_DB_NAME")
shiny_port <- Sys.getenv("SHINY_PORT")
con <- dbConnect(odbc::odbc(), driver = "PostgreSQL", Server = pg_host,
                 Database = pg_db_name, UID = pg_user, PWD = pg_cred,
                 Port = 5432)
block_time <- 120000
second_std <- .977
# Set outlier threshold
oth <- function(u, limit) { (u * limit) + u }
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
  size_outlier_threshold <- oth(mean(tx_fee_dataset2$size), second_std)
  fee_outlier_threshold <- oth(mean(tx_fee_dataset2$fee), second_std)
  final_data_set <-
    subset(tx_fee_dataset2, tx_fee_dataset2$size < size_outlier_threshold)
  # Strip away outliers
  final_data_set
}

# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above in RStudio.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#
library(shiny)
# see https://shiny.rstudio.com/articles/caching.html
shinyOptions(cache = cachem::cache_disk("./app_cache/cache/"))
port <- readr::parse_integer(shiny_port)
options(shiny.port = port, shiny.host = "0.0.0.0")
# Define UI for application that draws a histogram
ui <- fluidPage(
  # Application title
  titlePanel("Monero Transaction K-Means Clustering"),
  column(
      width = 4,
      h3("Analitiko Height"),
      textOutput("heightText"),
      h3("Cluster Centers"),
      tableOutput("centerTable"),
      h3("Within Sum of Squares"),
      tableOutput("withinTable"),
      h3("Between SS / Total SS"),
      textOutput("ssText"),
      h3("Correlation Matrix"),
      plotOutput("heatPlot"),
      h3("Cluster Selection - Elbow Method"),
      plotOutput("elbowPlot")
    ),
    # Show a plot of the transaction fee per byte versus size
    mainPanel(
      plotOutput(
        "sPlot", width = "100%", height = "700px"
      ),
      plotOutput(
        "cPlot", width = "100%", height = "700px"
      ),
      plotOutput(
        "c2Plot", width = "100%", height = "700px"
      )
    )
  )
# Define server logic required to draw a plot
server <- function(input, output) {
  observe({
    tx_fee_dataset <<- etl()
    kc <<- kmeans(tx_fee_dataset, 4, iter.max = 40)
    kc2 <<- kmeans(tx_fee_dataset, 2, iter.max = 20)
    invalidateLater(block_time)
  })
  # outlier-free plot
  output$sPlot <- shiny::bindCache({
    renderPlot({
      # Draw the plot with the specified number of transactions
      # Bin size control + color palette
      ggplot(tx_fee_dataset,
             aes(x=fee_per_byte, y = size)) + geom_bin2d(bins = 70) +
        scale_fill_continuous(type = "viridis") + theme_bw()
    })
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
    output$cPlot <- shiny::bindCache({
      renderPlot({
        clusplot(tx_fee_dataset, kc$cluster,
                 color = TRUE, shade = TRUE, labels = 4, lines = 0)
      })
    })
    # Between SS / Total SS
    output$ssText <- renderText({
      kc$betweenss / kc$totss
    })
    # Analitiko Height
    output$heightText <- renderText({
      max(tx_fee_dataset$height)
    })
    # Verify cluster selection with the elbow method,
    # within groups sum of squares.
    # Take a 1% rolling sample to speed up UI
    output$elbowPlot <- shiny::bindCache({
      renderPlot({
        mod_tx_fee_dataset <- tx_fee_dataset
        mod_tx_fee_dataset$height <- NULL
        mod_tx_fee_dataset$fee <- NULL
        mod_tx_fee_dataset$num_inputs <- NULL
        mod_tx_fee_dataset$num_outputs <- NULL
        data <- length(mod_tx_fee_dataset$fee_per_byte)
        multiplier <- 1
        if (data > 10000) {
          multiplier <- 0.01
        }
        sample_size <- data * multiplier
        sample_dataset <- mod_tx_fee_dataset[
          sample(nrow(mod_tx_fee_dataset), floor(sample_size),
                 replace = FALSE, prob = NULL), ]
        fviz_nbclust(sample_dataset, kmeans, method = "wss") +
          geom_vline(xintercept = 2, linetype = 2) +
          labs(subtitle = "Elbow method")
      })
    })
    # Modified Cluster plot with two clusters and subset to fee_per_byte
    output$c2Plot <- shiny::bindCache({
      renderPlot({
        mod_tx_fee_dataset <- tx_fee_dataset
        mod_tx_fee_dataset$height <- NULL
        mod_tx_fee_dataset$size <- NULL
        mod_tx_fee_dataset$num_inputs <- NULL
        mod_tx_fee_dataset$num_outputs <- NULL
        clusplot(mod_tx_fee_dataset, kc2$cluster,
                 color = TRUE, shade = TRUE, labels = 2, lines = 0)
      })
    }) 
    # Create correlation matrix with heatmap
    cormat <- round(cor(tx_fee_dataset[1:6]), 2)
    head(cormat)
    melted_cormat <- melt(cormat)
    head(melted_cormat)
    output$heatPlot <- shiny::bindCache({
      renderPlot({
        ggplot(data = melted_cormat, aes(x = Var1, y = Var2, fill = value)) +
          geom_tile()
      })
    })
}
# Run the application
shinyApp(ui = ui, server = server)
