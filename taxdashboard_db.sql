-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 21, 2025 at 10:31 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `taxdashboard_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `casedos_table`
--

CREATE TABLE `casedos_table` (
  `id` int(11) NOT NULL,
  `caseId` int(11) NOT NULL,
  `documentPath` varchar(255) DEFAULT NULL,
  `createDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `casedos_table`
--

INSERT INTO `casedos_table` (`id`, `caseId`, `documentPath`, `createDate`) VALUES
(1, 1, 'public\\docs\\documents-1736668648301-457763994.pdf', '2025-01-12 07:57:28'),
(2, 2, 'public\\docs\\documents-1736668684382-798659845.pdf', '2025-01-12 07:58:04'),
(3, 2, 'public\\docs\\documents-1736668684432-259248203.pdf', '2025-01-12 07:58:04'),
(4, 2, 'public\\docs\\documents-1736668684434-84066344.pdf', '2025-01-12 07:58:04'),
(5, 2, 'public\\docs\\documents-1736668684446-226851872.docx', '2025-01-12 07:58:04'),
(6, 1, 'public\\docs\\documents-1737237176454-216981467.pdf', '2025-01-18 21:52:56'),
(7, 1, 'public\\docs\\documents-1737271812269-73843159.pdf', '2025-01-19 07:30:12'),
(8, 3, 'public\\docs\\documents-1737271817910-264664739.pdf', '2025-01-19 07:30:17'),
(9, 1, 'public\\docs\\documents-1737272045735-146919993.xlsx', '2025-01-19 07:34:05');

-- --------------------------------------------------------

--
-- Table structure for table `casenotes_table`
--

CREATE TABLE `casenotes_table` (
  `id` int(11) NOT NULL,
  `caseId` int(11) NOT NULL,
  `CaseNotes` varchar(255) DEFAULT NULL,
  `createdbyId` int(11) NOT NULL,
  `createDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `casenotes_table`
--

INSERT INTO `casenotes_table` (`id`, `caseId`, `CaseNotes`, `createdbyId`, `createDate`) VALUES
(2, 2, 'hahahhaha', 1, '2025-01-18 22:32:02'),
(3, 2, 'hahgsdfgsfdgahhaha', 1, '2025-01-18 22:32:06');

-- --------------------------------------------------------

--
-- Table structure for table `case_table`
--

CREATE TABLE `case_table` (
  `id` int(11) NOT NULL,
  `caseNo` varchar(255) NOT NULL,
  `taxYear` year(4) NOT NULL,
  `status` enum('open','inprogress','awaiting docs','pending payments','paid','closed') NOT NULL,
  `userId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `case_table`
--

INSERT INTO `case_table` (`id`, `caseNo`, `taxYear`, `status`, `userId`) VALUES
(1, '15ATUA', '2025', 'open', 1),
(2, 'F21XWG', '2025', 'open', 1),
(3, '9BP686', '2025', 'open', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_table`
--

CREATE TABLE `user_table` (
  `id` int(11) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phoneNumber` varchar(20) DEFAULT NULL,
  `userRole` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `createDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `updateDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `visible` tinyint(1) DEFAULT 1,
  `OTP` varchar(6) DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `user_table`
--

INSERT INTO `user_table` (`id`, `firstName`, `lastName`, `email`, `phoneNumber`, `userRole`, `password`, `createDate`, `updateDate`, `visible`, `OTP`, `otp_expiry`) VALUES
(1, 'salman', 'lodhi', 'lodhi0332@gmail.com', '0232002002', '1', '$2a$10$xUTayO8ymxQKto8Bn4YXDOpqw6s1gLqKrpzc6oSc9RRI0UDjul316', '2024-12-27 19:53:04', '2025-01-11 21:11:35', 1, NULL, NULL),
(5, 'salman', 'lodhi', 'lodhi032@gmail.com', '0232002002', '1', '$2a$10$6zT4T3Q9O6UzkE0bEu7XCeRxP4lfVzg4Qy9Ng95Ldt3.iHurLM9vm', '2024-12-27 20:54:22', '2024-12-27 20:54:22', 1, NULL, NULL),
(6, 'salman', 'lodhi', 'lodhi02@gmail.com', '0232002002', '1', '$2a$10$qZfF/FwYVorv5h6l2BMEj.4.UxpFQtbeUjP7W5iF1N9VVo4I8K7Fu', '2025-01-01 08:50:53', '2025-01-01 08:50:53', 1, NULL, NULL),
(7, 'salman', 'lodhi', 'lodhi@gmail.com', '0232002002', NULL, '$2a$10$G4cw24RjweXqhoBqGjkmge1sc7mHHWN.lj4pYY3lqykrk1H7Ftgd6', '2025-01-11 21:17:07', '2025-01-11 21:17:07', 1, NULL, NULL),
(8, 'salman', 'lodhi', 'salman@gmail.com', '0232002002', '1', '$2a$10$4MDwUYhxu4RE9JZIBEXfFuIkvmnEpIDApVBU8KYIoCQjnZmXLDhoG', '2025-01-11 21:18:48', '2025-01-11 21:18:48', 1, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `casedos_table`
--
ALTER TABLE `casedos_table`
  ADD PRIMARY KEY (`id`),
  ADD KEY `caseId` (`caseId`);

--
-- Indexes for table `casenotes_table`
--
ALTER TABLE `casenotes_table`
  ADD PRIMARY KEY (`id`),
  ADD KEY `caseId` (`caseId`),
  ADD KEY `createdbyId` (`createdbyId`);

--
-- Indexes for table `case_table`
--
ALTER TABLE `case_table`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `user_table`
--
ALTER TABLE `user_table`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `casedos_table`
--
ALTER TABLE `casedos_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `casenotes_table`
--
ALTER TABLE `casenotes_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `case_table`
--
ALTER TABLE `case_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_table`
--
ALTER TABLE `user_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `casedos_table`
--
ALTER TABLE `casedos_table`
  ADD CONSTRAINT `casedos_table_ibfk_1` FOREIGN KEY (`caseId`) REFERENCES `case_table` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `casenotes_table`
--
ALTER TABLE `casenotes_table`
  ADD CONSTRAINT `casenotes_table_ibfk_1` FOREIGN KEY (`caseId`) REFERENCES `case_table` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `casenotes_table_ibfk_2` FOREIGN KEY (`createdbyId`) REFERENCES `user_table` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `case_table`
--
ALTER TABLE `case_table`
  ADD CONSTRAINT `case_table_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user_table` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
